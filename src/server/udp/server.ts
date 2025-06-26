import dgram from 'dgram';
import { recordServerStatus } from '../model/serverStatus.js';
import { logger } from '../utils/logger.js';

export function initUdpServer(port: number) {
  const server = dgram.createSocket('udp4');

  server.on('error', (err) => {
    logger.info(`Init error:\n${err.stack}`);
    server.close();
  });

  server.on('message', async (msg, rinfo) => {
    try {
      const raw = String(msg);
      const json = JSON.parse(String(msg));

      logger.info('[UDP] recevice tianji report:', raw, 'info', rinfo);

      await recordServerStatus(json);
    } catch (err) {}
  });

  server.on('listening', () => {
    const address = server.address();
    logger.info(`UDP Server is listening: ${address.address}:${address.port}`);
  });

  server.bind(port);
}
