import { ServerStatusInfo } from '../../types/index.js';
import { promServerCounter } from '../utils/prometheus/client.js';
import { createSubscribeInitializer, subscribeEventBus } from '../ws/shared.js';
import { isServerOnline } from '@tianji/shared';
import { getCacheManager } from '../cache/index.js';
import { logger } from '../utils/logger.js';

// Helper function to get cache key for server map
function getServerMapCacheKey(workspaceId: string): string {
  return `server_map:${workspaceId}`;
}

// Helper function to get server map from cache
async function getServerMapFromCache(
  workspaceId: string
): Promise<Record<string, ServerStatusInfo>> {
  const cacheManager = await getCacheManager();
  const key = getServerMapCacheKey(workspaceId);

  const cachedValue = await cacheManager.get(key);
  if (cachedValue) {
    try {
      return JSON.parse(String(cachedValue));
    } catch (err) {
      logger.error('[ServerStatus] Error parsing cached server map:', err);
      return {};
    }
  }

  return {};
}

// Helper function to save server map to cache
async function saveServerMapToCache(
  workspaceId: string,
  serverMap: Record<string, ServerStatusInfo>
): Promise<void> {
  const cacheManager = await getCacheManager();
  const key = getServerMapCacheKey(workspaceId);

  try {
    await cacheManager.set(key, JSON.stringify(serverMap));
  } catch (err) {
    logger.error('[ServerStatus] Error saving server map to cache:', err);
  }
}

// Helper function to get cache key for server history
function getServerHistoryCacheKey(workspaceId: string, name: string): string {
  return `server_history:${workspaceId}:${name}`;
}

// Helper function to get server history from cache
async function getServerHistoryFromCache(
  workspaceId: string,
  name: string
): Promise<ServerStatusInfo[]> {
  const cacheManager = await getCacheManager();
  const key = getServerHistoryCacheKey(workspaceId, name);

  const cachedValue = await cacheManager.get(key);
  if (cachedValue) {
    try {
      return JSON.parse(String(cachedValue));
    } catch (err) {
      logger.error('[ServerStatus] Error parsing cached history:', err);
      return [];
    }
  }

  return [];
}

// Helper function to save server history to cache
async function saveServerHistoryToCache(
  workspaceId: string,
  name: string,
  history: ServerStatusInfo[]
): Promise<void> {
  const cacheManager = await getCacheManager();
  const key = getServerHistoryCacheKey(workspaceId, name);

  try {
    await cacheManager.set(key, JSON.stringify(history));
  } catch (err) {
    logger.error('[ServerStatus] Error saving history to cache:', err);
  }
}

createSubscribeInitializer('onServerStatusUpdate', async (workspaceId) => {
  return await getServerMapFromCache(workspaceId);
});

export async function recordServerStatus(info: ServerStatusInfo) {
  const { workspaceId, name, hostname, timeout, payload } = info;

  if (!workspaceId || !name || !hostname) {
    console.warn(
      '[ServerStatus] lost some necessary params, request will be ignore',
      info
    );
    return;
  }

  // Get current server map from cache
  const serverMap = await getServerMapFromCache(workspaceId);

  // Update current server status
  const serverKey = name || hostname;
  serverMap[serverKey] = {
    workspaceId,
    name,
    hostname,
    timeout,
    updatedAt: Date.now(),
    payload,
  };

  // Save updated server map to cache
  await saveServerMapToCache(workspaceId, serverMap);

  // Update server history using cache
  const history = await getServerHistoryFromCache(workspaceId, serverKey);
  history.push(serverMap[serverKey]);

  // Keep only the last 20 records
  if (history.length > 20) {
    history.shift();
  }

  saveServerHistoryToCache(workspaceId, serverKey, history).catch((err) => {
    logger.error('[ServerStatus] Error saving history to cache:', err);
  });

  promServerCounter.set(
    {
      workspaceId,
    },
    Object.keys(serverMap).length
  );

  subscribeEventBus.emit('onServerStatusUpdate', workspaceId, serverMap);
}

export async function clearOfflineServerStatus(workspaceId: string) {
  const serverMap = await getServerMapFromCache(workspaceId);

  if (!serverMap || Object.keys(serverMap).length === 0) {
    return serverMap;
  }

  const offlineNode: string[] = [];
  Object.entries(serverMap).forEach(([key, info]) => {
    if (!isServerOnline(info)) {
      offlineNode.push(key);
    }
  });

  for (const node of offlineNode) {
    delete serverMap[node];
  }

  // Save updated server map to cache
  await saveServerMapToCache(workspaceId, serverMap);

  subscribeEventBus.emit('onServerStatusUpdate', workspaceId, serverMap);

  return serverMap;
}

export async function getServerCount(workspaceId: string): Promise<number> {
  const serverMap = await getServerMapFromCache(workspaceId);
  return Object.keys(serverMap).length;
}

export async function getServerStatusHistory(
  workspaceId: string,
  name: string
): Promise<ServerStatusInfo[]> {
  return await getServerHistoryFromCache(workspaceId, name);
}
