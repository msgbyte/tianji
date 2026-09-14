import express, { type ErrorRequestHandler } from 'express';
import 'express-async-errors';
import compression from 'compression';
import swaggerUI from 'swagger-ui-express';
import morgan from 'morgan';
import { websiteRouter } from './router/website.js';
import { applicationRouter } from './router/application.js';
import { telemetryRouter } from './router/telemetry.js';
import {
  trpcExpressMiddleware,
  trpcOpenapiDocument,
  trpcOpenapiHttpHandler,
} from './trpc/index.js';
import { env } from './utils/env.js';
import cors from 'cors';
import { serverStatusRouter } from './router/serverStatus.js';
import { lighthouseRouter } from './router/lighthouse.js';
import { logger } from './utils/logger.js';
import { monitorRouter } from './router/monitor.js';
import { healthRouter } from './router/health.js';
import path from 'path';
import { customDomainManager } from './model/page/manager.js';
import { ExpressAuth } from '@auth/express';
import { authConfig } from './model/auth.js';
import { prometheusApiVersion } from './middleware/prometheus/index.js';
import { billingRouter } from './router/billing.js';
import { aiGatewayRouter } from './router/aiGateway.js';
import { aiRouterRouter } from './router/aiRouter.js';
import { pushRouter } from './router/push.js';
import { workerRouter } from './router/worker.js';
import { insightsRouter } from './router/insights.js';
import { shortlinkRouter } from './router/shortlink.js';
import {
  serveStaticPageBySlug,
  staticPageRouter,
} from './router/staticPage.js';
import { pageRouter } from './router/page.js';
import { geminiError } from './model/aiGateway/gemini.js';

const app = express();

app.set('trust proxy', true);
app.use(
  prometheusApiVersion({
    metricsPath: env.observability.prometheus.metricsPath,
  })
);
app.use(compression());
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
if (!env.disableAccessLogs && process.env.NODE_ENV !== 'test') {
  app.use(morgan('tiny'));
}
app.use(cors());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

app.use(
  '/tracker.js',
  express.static('./public/tracker.js', {
    maxAge: '7d',
  })
);

app.use('/health', healthRouter);
app.use('/s', shortlinkRouter);
app.use('/api/auth/*', ExpressAuth(authConfig));
app.use('/api/website', websiteRouter);
app.use('/api/application', applicationRouter);
app.use('/api/ai', aiGatewayRouter);
app.use('/api/ai-router', aiRouterRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/page', pageRouter);
app.use('/api/billing', billingRouter);
app.use('/api/push', pushRouter);
app.use('/api/worker', workerRouter);
app.use('/monitor', monitorRouter);
app.use('/telemetry', telemetryRouter);
app.use('/serverStatus', serverStatusRouter);
app.use('/lh', lighthouseRouter);

app.use('/trpc', trpcExpressMiddleware);

if (env.customTrackerScriptName) {
  app.get(`/${env.customTrackerScriptName}`, (req, res) =>
    res.sendFile(path.resolve(process.cwd(), './public/tracker.js'))
  );
}

if (env.allowOpenapi) {
  app.use(
    '/open/_swagger',
    swaggerUI.serve,
    swaggerUI.setup(trpcOpenapiDocument)
  );
  app.use('/open/_document', (req, res) => res.send(trpcOpenapiDocument));
  app.use('/open/_ui', (req, res) =>
    res.send(`
      <html>
        <head>
          <title>Tianji OpenAPI</title>
          <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
          <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
        </head>
        <body>
          <elements-api
            apiDescriptionUrl="/open/_document"
            router="hash"
            layout="responsive"
            logo="https://tianji.dev/img/logo.svg"
          />
          <style>
            a[href^='https://stoplight.io'] {
              display: none !important;
            }
          </style>
        </body>
      </html>`)
  );
  app.use('/open', trpcOpenapiHttpHandler);
}

// API misses must never fall through to the frontend or custom-domain page.
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API endpoint not found.' });
});

// Custom domain: only for root path so /p/:slug and /status/:slug are not intercepted
app.use('/*', async (req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    const customDomain = customDomainManager.findPageDomain(req.hostname);
    if (customDomain) {
      if (customDomain.type === 'static') {
        const sent = await serveStaticPageBySlug(customDomain.slug, res);
        if (sent) return;
      } else {
        const path = `/status/${customDomain.slug}`;
        res
          .status(200)
          .send(
            `<body style="padding: 0; margin: 0;"><iframe style="border:none; width: 100%; height: 100%;" title="" src="${path}" /></body>`
          );
        return;
      }
    }
  }

  next();
});

// Static
app.use(express.static('public'));

app.use('/p', staticPageRouter);

// fallback
const webEntry = path.join(process.cwd(), 'public', 'index.html');
app.use('/*', (req, res) => {
  if (req.method === 'GET' && req.accepts('html')) {
    res.sendFile(webEntry);
  } else res.status(404).json({ message: 'Not found.' });
});

app.use(((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
      ? err.status
      : 500;
  if (/^\/api\/ai\/[^/]+\/[^/]+\/custom\/[^/]+\/models\//.test(req.path)) {
    res
      .status(status)
      .json(
        geminiError(
          status,
          status < 500 ? 'Invalid Gemini request.' : 'Internal server error.'
        )
      );
    return;
  }
  // Parser errors contain the caller's entire body; never log that payload.
  logger.error('[express]', err.message);
  res.status(status).json({ message: err.message });
}) as ErrorRequestHandler);

export { app };
