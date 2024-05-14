import express from 'express';
import 'express-async-errors';
import compression from 'compression';
import swaggerUI from 'swagger-ui-express';
import passport from 'passport';
import morgan from 'morgan';
import { websiteRouter } from './router/website';
import { workspaceRouter } from './router/workspace';
import { telemetryRouter } from './router/telemetry';
import {
  trpcExpressMiddleware,
  trpcOpenapiDocument,
  trpcOpenapiHttpHandler,
} from './trpc';
import { env } from './utils/env';
import cors from 'cors';
import { serverStatusRouter } from './router/serverStatus';
import { logger } from './utils/logger';
import { monitorRouter } from './router/monitor';
import { healthRouter } from './router/health';
import path from 'path';
import { monitorPageManager } from './model/monitor/page/manager';
import { ExpressAuth } from '@auth/express';
import { authConfig } from './model/auth';

const app = express();

app.set('trust proxy', true);
app.use(compression());
app.use(express.json());
app.use(passport.initialize());
app.use(morgan('tiny'));
app.use(cors());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

app.use(
  '/tracker.js',
  express.static('./public/tracker.js', {
    maxAge: '7d',
  })
);

app.use('/auth/*', ExpressAuth(authConfig));
app.use('/health', healthRouter);
app.use('/api/website', websiteRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/monitor', monitorRouter);
app.use('/telemetry', telemetryRouter);
app.use('/serverStatus', serverStatusRouter);

app.use('/trpc', trpcExpressMiddleware);

if (env.customTrackerScriptName) {
  app.get(`/${env.customTrackerScriptName}`, (req, res) =>
    res.sendFile(path.resolve(process.cwd(), './public/tracker.js'))
  );
}

if (env.allowOpenapi) {
  app.use('/open/_ui', swaggerUI.serve, swaggerUI.setup(trpcOpenapiDocument));
  app.use('/open/_document', (req, res) => res.send(trpcOpenapiDocument));
  app.use('/open', trpcOpenapiHttpHandler);
}

// Custom Status Page
app.use('/*', (req, res, next) => {
  if (req.baseUrl === '/' || req.baseUrl === '') {
    const customDomain = monitorPageManager.findPageDomain(req.hostname);
    if (customDomain) {
      res
        .status(200)
        .send(
          `<body style="padding: 0; margin: 0;"><iframe style="border:none; width: 100%; height: 100%;" title="" src="/status/${customDomain.slug}" /></body>`
        );
      return;
    }
  }

  next();
});

// Static
app.use(express.static('public'));

// fallback
const webEntry = path.join(process.cwd(), 'public', 'index.html');
app.use('/*', (req, res) => {
  if (req.method === 'GET' && req.accepts('html')) {
    res.sendFile(webEntry);
  }
});

app.use((err: any, req: any, res: any, next: any) => {
  logger.error('[express]', err);
  res.status(500).json({ message: err.message });
});

export { app };
