import 'dotenv/config';
import './init';
import express from 'express';
import 'express-async-errors';
import ViteExpress from 'vite-express';
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
import { initUdpServer } from './udp/server';
import { createServer } from 'http';
import { initSocketio } from './ws';
import { monitorManager } from './model/monitor';
import { settings } from './utils/settings';
import { env } from './utils/env';
import cors from 'cors';

const port = settings.port;

const app = express();
const httpServer = createServer(app);

initUdpServer(port);

initSocketio(httpServer);

monitorManager.startAll();

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

app.use('/api/website', websiteRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/telemetry', telemetryRouter);

if (env.allowOpenapi) {
  app.use('/open/_ui', swaggerUI.serve, swaggerUI.setup(trpcOpenapiDocument));
  app.use('/open/_document', (req, res) => res.send(trpcOpenapiDocument));
  app.use('/open', trpcOpenapiHttpHandler);
}
app.use('/trpc', trpcExpressMiddleware);

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

httpServer.listen(port, () => {
  ViteExpress.bind(app, httpServer, () => {
    console.log(`Server is listening on port ${port}...`);
    if (env.allowOpenapi) {
      console.log(`Openapi UI: http://127.0.0.1:${port}/open/_ui`);
    }
    console.log(`Website: http://127.0.0.1:${port}`);
  });
});
