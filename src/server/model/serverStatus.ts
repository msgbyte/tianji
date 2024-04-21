import { ServerStatusInfo } from '../../types';
import { createSubscribeInitializer, subscribeEventBus } from '../ws/shared';
import _ from 'lodash';
import { isServerOnline } from '@tianji/shared';

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

export function clearOfflineServerStatus(workspaceId: string) {
  if (!serverMap[workspaceId]) {
    return;
  }

  const offlineNode: string[] = [];
  Object.entries(serverMap[workspaceId]).forEach(([key, info]) => {
    if (!isServerOnline(info)) {
      offlineNode.push(key);
    }
  });

  for (const node of offlineNode) {
    delete serverMap[workspaceId][node];
  }

  subscribeEventBus.emit(
    'onServerStatusUpdate',
    workspaceId,
    serverMap[workspaceId]
  );

  return serverMap[workspaceId];
}

export function getServerCount(workspaceId: string): number {
  if (!serverMap[workspaceId]) {
    return 0;
  }

  return Object.keys(serverMap[workspaceId]).length;
}
