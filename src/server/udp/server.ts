import dgram from 'dgram';
import { recordServerStatus } from '../model/serverStatus';

export function initUdpServer(port: number) {
  const server = dgram.createSocket('udp4');

  server.on('error', (err) => {
    console.log(`Init error:\n${err.stack}`);
    server.close();
  });

  server.on('message', (msg, rinfo) => {
    try {
      const raw = String(msg);
      const json = JSON.parse(String(msg));

      console.log('[UDP] recevice tianji report:', raw, 'info', rinfo);

      recordServerStatus(json);
    } catch (err) {}
  });

  server.on('listening', () => {
    const address = server.address();
    console.log(`UDP Server is listening: ${address.address}:${address.port}`);
  });

  server.bind(port);
}
