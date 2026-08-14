import { beforeAll, describe, expect, it, vi } from 'vitest';

const workerCacheMocks = vi.hoisted(() => ({
  createWorkerCacheManager: vi.fn(),
  scheduleWorkerKVPostgresCleanup: vi.fn(),
}));

vi.mock('../utils/env.js', () => ({
  env: {
    cache: {
      memoryOnly: true,
      redisUrl: undefined,
    },
  },
}));

vi.mock('./worker.js', () => workerCacheMocks);

import { getCacheManager, getWorkerCacheManager } from './index.js';

describe('getWorkerCacheManager', () => {
  beforeAll(() => {
    workerCacheMocks.createWorkerCacheManager.mockImplementation(
      (shared) => shared
    );
  });

  it('memoizes the Worker facade with PostgreSQL maintenance wiring', async () => {
    const shared = await getCacheManager();

    await expect(getWorkerCacheManager()).resolves.toBe(shared);
    await expect(getWorkerCacheManager()).resolves.toBe(shared);

    expect(workerCacheMocks.createWorkerCacheManager).toHaveBeenCalledOnce();
    expect(workerCacheMocks.createWorkerCacheManager).toHaveBeenCalledWith(
      shared,
      workerCacheMocks.scheduleWorkerKVPostgresCleanup
    );
  });
});
