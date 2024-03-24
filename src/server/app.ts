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

const app = express();

app.use(compression());
app.use(express.json());
app.use(passport.initialize());
app.use(morgan('tiny'));
app.use(cors());
app.use(express.static('public'));

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

app.use(
  '/tracker.js',
  express.static('./public/tracker.js', {
    maxAge: '7d',
  })
);

app.use('/health', healthRouter);
app.use('/api/website', websiteRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/monitor', monitorRouter);
app.use('/telemetry', telemetryRouter);
app.use('/serverStatus', serverStatusRouter);

app.use('/trpc', trpcExpressMiddleware);

if (env.customTrackerScriptName) {
  app.get(`/${env.customTrackerScriptName}`, (req, res) =>
    res.sendFile(path.resolve(__dirname, './public/tracker.js'))
  );
}

if (env.allowOpenapi) {
  app.use('/open/_ui', swaggerUI.serve, swaggerUI.setup(trpcOpenapiDocument));
  app.use('/open/_document', (req, res) => res.send(trpcOpenapiDocument));
  app.use('/open', trpcOpenapiHttpHandler);
}

// fallback
app.use('/*', (req, res) => {
  if (req.method === 'GET' && req.accepts('html')) {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  }
});

app.use((err: any, req: any, res: any, next: any) => {
  logger.error('[express]', err);
  res.status(500).json({ message: err.message });
});

export { app };
