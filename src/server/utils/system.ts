import os from 'os';
import { logger } from './logger.js';

export function logSystemInfo() {
  const totalMemMB = Math.round(os.totalmem() / 1024 / 1024);
  const freeMemMB = Math.round(os.freemem() / 1024 / 1024);
  const cpus = os.cpus();

  logger.info(
    `[System] OS: ${os.type()} ${os.release()} (${os.arch()}) | Node: ${process.version}`
  );
  logger.info(
    `[System] CPU: ${cpus[0]?.model ?? 'unknown'} x ${cpus.length} cores`
  );
  logger.info(
    `[System] Memory: ${totalMemMB} MB total / ${freeMemMB} MB free`
  );
}
