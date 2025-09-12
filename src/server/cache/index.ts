import { caching, MemoryCache } from 'cache-manager';
import { uniqueId } from 'lodash-es';

let _cacheManager: MemoryCache;
export async function getCacheManager() {
  if (_cacheManager) {
    return _cacheManager;
  }

  const cacheManager = await caching('memory', {
    max: 100,
    ttl: 10 * 60 * 1000 /*milliseconds*/,
  });

  _cacheManager = cacheManager;

  return cacheManager;
}

export function buildQueryWithCache<T, Args extends any[]>(
  fetchFn: (...args: Args) => Promise<T>
) {
  const id = uniqueId('cache-query');

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

    await cacheManager.del(key);
  };

  return { get, del, update };
}
