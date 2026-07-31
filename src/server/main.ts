import 'dotenv/config';
import './init.js';
import { initUdpServer } from './udp/server.js';
import { createServer } from 'http';
import { initSocketio } from './ws/index.js';
import { monitorManager } from './model/monitor/index.js';
import { workerCronManager } from './model/worker/manager.js';
import { env } from './utils/env.js';
import { initCronjob } from './cronjob/index.js';
import { logger } from './utils/logger.js';
import { app } from './app.js';
import { runMQWorker } from './mq/worker.js';
import { initCounter } from './utils/prometheus/index.js';
import { initClickHouse } from './clickhouse/index.js';
import { flushAllBatchWriters } from './utils/batchWriter.js';
import { logSystemInfo } from './utils/system.js';
import { monitorBroadcast } from './model/monitor/broadcast.js';
import { workerCronBroadcast } from './model/worker/broadcast.js';

logSystemInfo();

const port = env.port;

const httpServer = createServer(app);
let isShuttingDown = false;

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

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

await startServer();

async function startServer() {
  await monitorBroadcast.start(
    (event) => monitorManager.handleBroadcast(event),
    () => monitorManager.reconcileAll()
  );
  if (isShuttingDown) {
    return;
  }

  await monitorManager.startAll();
  if (isShuttingDown) {
    return;
  }

  if (env.enableFunctionWorker) {
    await workerCronBroadcast.start(
      (event) => workerCronManager.handleBroadcast(event),
      () => workerCronManager.reconcileAll()
    );
    if (isShuttingDown) {
      return;
    }

    await workerCronManager.startAll();
    if (isShuttingDown) {
      return;
    }
  }

  httpServer.listen(port, () => {
    logger.info(`Server is listening on port ${port}...`);
    if (env.allowOpenapi) {
      logger.info(`Openapi UI: http://127.0.0.1:${port}/open/_ui`);
    }
    logger.info(`Website: http://127.0.0.1:${port}`);
  });
}

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info(`Received ${signal}, shutting down gracefully...`);

  // Stop accepting new connections
  httpServer.close();

  await Promise.all([
    monitorBroadcast.close(),
    workerCronBroadcast.close(),
  ]);

  // Flush all pending batch writes
  await flushAllBatchWriters();

  logger.info('Graceful shutdown complete.');
  process.exit(0);
}
