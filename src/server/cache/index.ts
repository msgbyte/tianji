import Keyv, { type KeyvStoreAdapter } from 'keyv';
import KeyvRedis from '@keyv/redis';
import KeyvPostgres from '@keyv/postgres';
import { env } from '../utils/env.js';

let _cacheManager: Keyv;
export async function getCacheManager() {
  if (_cacheManager) {
    return _cacheManager;
  }

  let store: KeyvStoreAdapter | undefined = undefined;
  if (!env.cache.memoryOnly) {
    store = env.cache.redisUrl
      ? new KeyvRedis({
          url: env.cache.redisUrl,
        })
      : new KeyvPostgres({
          uri: env.db.url,
          schema: 'cache',
          table: 'cache',
        });
  }

  const cacheManager = new Keyv({
    store: store ?? new Map(),
    ttl: 10 * 60 * 1000,
    namespace: 'tianji-cache',
  });

  _cacheManager = cacheManager;

  return cacheManager;
}

interface BuildQueryWithCacheOptions {
  /**
   * In-memory cache TTL in milliseconds. Defaults to 30s.
   * Set to 0 to disable the in-memory layer.
   */
  memTTL?: number;
}

interface MemCacheEntry<T> {
  value: T;
  expiry: number;
}

export function buildQueryWithCache<T, Args extends any[]>(
  name: string,
  fetchFn: (...args: Args) => Promise<T>,
  options?: BuildQueryWithCacheOptions
) {
  const id = `cache-query:${name}`;
  const memTTL = options?.memTTL ?? 30_000;
  const memCache = new Map<string, MemCacheEntry<T>>();

  const buildKey = (...args: Args) =>
    [id, ...args.map((a) => JSON.stringify(a))].join('|');

  const get = async (...args: Args): Promise<T> => {
    const key = buildKey(...args);

    // L1: in-memory cache
    if (memTTL > 0) {
      const mem = memCache.get(key);
      if (mem && mem.expiry > Date.now()) {
        return mem.value;
      }
    }

    // L2: distributed cache (Redis / PostgreSQL / Map)
    const cacheManager = await getCacheManager();
    const cachedValue = await cacheManager.get(key);
    if (cachedValue) {
      try {
        const parsed = JSON.parse(String(cachedValue)) as T;
        if (memTTL > 0) {
          memCache.set(key, { value: parsed, expiry: Date.now() + memTTL });
        }
        return parsed;
      } catch (err) {
        console.error(err);
      }
    }

    // L3: fetch from DB
    const realValue = await fetchFn(...args);

    if (realValue != null) {
      await cacheManager.set(key, JSON.stringify(realValue));

      if (memTTL > 0) {
        memCache.set(key, { value: realValue, expiry: Date.now() + memTTL });
      }
    }

    return realValue;
  };

  const update = (...args: Args) => {
    const key = buildKey(...args);

    return async (value: T) => {
      const cacheManager = await getCacheManager();
      await cacheManager.set(key, JSON.stringify(value));

      if (memTTL > 0) {
        memCache.set(key, { value, expiry: Date.now() + memTTL });
      }
    };
  };

  const del = async (...args: Args) => {
    const key = buildKey(...args);

    memCache.delete(key);

    const cacheManager = await getCacheManager();
    await cacheManager.delete(key);
  };

  return { get, del, update };
}

// Export distributed lock functionality
export {
  DistributedLock,
  distributedLock,
  withDistributedLock,
  type DistributedLockOptions,
  type LockResult,
} from './distributedLock.js';
