import 'dotenv/config';
import './init.js';
import { initUdpServer } from './udp/server.js';
import { createServer } from 'http';
import { initSocketio } from './ws/index.js';
import { monitorManager } from './model/monitor/index.js';
import { env } from './utils/env.js';
import { initCronjob } from './cronjob/index.js';
import { logger } from './utils/logger.js';
import { app } from './app.js';
import { runMQWorker } from './mq/worker.js';
import { initCounter } from './utils/prometheus/index.js';
import { initClickHouse } from './clickhouse/index.js';

const port = env.port;

const httpServer = createServer(app);

initUdpServer(port);

initSocketio(httpServer);

initCronjob();

initCounter();

runMQWorker();

if (env.clickhouse.enable) {
  initClickHouse().then(() => {
    logger.info('ClickHouse initialized.');
  });
}

monitorManager.startAll();

httpServer.listen(port, () => {
  logger.info(`Server is listening on port ${port}...`);
  if (env.allowOpenapi) {
    logger.info(`Openapi UI: http://127.0.0.1:${port}/open/_ui`);
  }
  logger.info(`Website: http://127.0.0.1:${port}`);
});
