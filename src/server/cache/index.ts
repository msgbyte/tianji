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

export function buildQueryWithCache<T, Args extends any[]>(
  name: string,
  fetchFn: (...args: Args) => Promise<T>
) {
  const id = `cache-query:${name}`;

  const get = async (...args: Args): Promise<T> => {
    const key = [id, ...args.map((a) => JSON.stringify(a))].join('|');
    const cacheManager = await getCacheManager();

    const cachedValue = await cacheManager.get(key);
    if (cachedValue) {
      try {
        return JSON.parse(String(cachedValue));
      } catch (err) {
        console.error(err);
      }
    }

    const realValue = await fetchFn(...args);

    if (realValue) {
      await cacheManager.set(key, JSON.stringify(realValue));
    }

    return realValue;
  };

  const update = (...args: Args) => {
    const key = [id, ...args.map((a) => JSON.stringify(a))].join('|');

    return async (value: T) => {
      const cacheManager = await getCacheManager();
      await cacheManager.set(key, JSON.stringify(value));
    };
  };

  const del = async (...args: Args) => {
    const cacheManager = await getCacheManager();
    const key = [id, ...args.map((a) => JSON.stringify(a))].join('|');

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
