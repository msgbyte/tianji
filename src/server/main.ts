import 'dotenv/config';
import './init';
import { initUdpServer } from './udp/server';
import { createServer } from 'http';
import { initSocketio } from './ws';
import { monitorManager } from './model/monitor';
import { env } from './utils/env';
import { initCronjob } from './cronjob';
import { logger } from './utils/logger';
import { app } from './app';

const port = env.port;

const httpServer = createServer(app);

initUdpServer(port);

initSocketio(httpServer);

initCronjob();

monitorManager.startAll();

httpServer.listen(port, () => {
  logger.info(`Server is listening on port ${port}...`);
  if (env.allowOpenapi) {
    logger.info(`Openapi UI: http://127.0.0.1:${port}/open/_ui`);
  }
  logger.info(`Website: http://127.0.0.1:${port}`);
});
