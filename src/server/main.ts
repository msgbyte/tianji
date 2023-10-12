import 'dotenv/config';
import './init';
import express from 'express';
import 'express-async-errors';
import ViteExpress from 'vite-express';
import compression from 'compression';
import passport from 'passport';
import morgan from 'morgan';
import { userRouter } from './router/user';
import { websiteRouter } from './router/website';
import { workspaceRouter } from './router/workspace';
import { telemetryRouter } from './router/telemetry';
import { trpcExpressMiddleware } from './trpc';
import { initUdpServer } from './udp/server';
import { createServer } from 'http';
import { initSocketio } from './ws';
import { monitorManager } from './model/monitor';
import { settings } from './utils/settings';

const port = settings.port;

const app = express();
const httpServer = createServer(app);

initUdpServer(port);

initSocketio(httpServer);

monitorManager.startAll();

app.use(compression());
app.use(express.json());
app.use(passport.initialize());
// app.use(morgan('tiny'));

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

app.use('/api/user', userRouter);
app.use('/api/website', websiteRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/telemetry', telemetryRouter);

app.use('/trpc', trpcExpressMiddleware);

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

httpServer.listen(port, () => {
  ViteExpress.bind(app, httpServer, () => {
    console.log(`Server is listening on port ${port}...`);
    console.log(`Website: http://127.0.0.1:${port}`);
  });
});
