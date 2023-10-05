import dgram from 'dgram';
import type { ServerStatusInfo } from '../../types';
import { createSubscribeInitializer, subscribeEventBus } from '../ws/shared';

const serverMap: Record<
  string, // workspaceId
  Record<
    string, // nodeName or hostname
    ServerStatusInfo
  >
> = {};

createSubscribeInitializer('onServerStatusUpdate', (workspaceId) => {
  if (!serverMap[workspaceId]) {
    serverMap[workspaceId] = {};
  }

  return serverMap[workspaceId];
});

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
      const { workspaceId, name, hostname, timeout, payload } = json;

      if (!workspaceId || !name || !hostname) {
        console.warn(
          '[UDP] lost some necessary params, request will be ignore',
          json
        );
      }

      console.log('recevice tianji report:', raw, 'info', rinfo);

      if (!serverMap[workspaceId]) {
        serverMap[workspaceId] = {};
      }

      serverMap[workspaceId][name || hostname] = {
        workspaceId,
        name,
        hostname,
        timeout,
        updatedAt: Date.now(),
        payload,
      };

      subscribeEventBus.emit(
        'onServerStatusUpdate',
        workspaceId,
        serverMap[workspaceId]
      );
    } catch (err) {}
  });

  server.on('listening', () => {
    const address = server.address();
    console.log(`UDP Server is listening: ${address.address}:${address.port}`);
  });

  server.bind(port);
}
