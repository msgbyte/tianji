import { ServerStatusInfo } from '../../types';
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

export function recordServerStatus(info: ServerStatusInfo) {
  const { workspaceId, name, hostname, timeout, payload } = info;

  if (!workspaceId || !name || !hostname) {
    console.warn(
      '[ServerStatus] lost some necessary params, request will be ignore',
      info
    );
    return;
  }

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
}
