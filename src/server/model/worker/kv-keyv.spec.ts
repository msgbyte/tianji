import EventEmitter from 'node:events';
import Keyv from 'keyv';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkerCacheManager } from '../../cache/worker.js';

const cacheModuleMocks = vi.hoisted(() => ({
  getCacheManager: vi.fn(),
  getWorkerCacheManager: vi.fn(),
  scheduleWorkerKVPostgresCleanup: vi.fn(),
}));

vi.mock('../../cache/index.js', () => cacheModuleMocks);

import { createWorkerKVFacade } from './kv.js';

class RejectingAdapter extends EventEmitter {
  namespace?: string;

  async get() {
    throw new Error('postgresql://user:secret@database.internal/tianji');
  }

  async set() {
    throw new Error('postgresql://user:secret@database.internal/tianji');
  }

  async delete() {
    throw new Error('postgresql://user:secret@database.internal/tianji');
  }

  async clear() {}
}

describe('Worker KV Keyv error boundary', () => {
  beforeEach(() => {
    const store = new RejectingAdapter();
    const shared = new Keyv({
      store,
      namespace: 'tianji-cache',
    });
    const worker = createWorkerCacheManager(shared);

    cacheModuleMocks.getCacheManager.mockResolvedValue(shared);
    cacheModuleMocks.getWorkerCacheManager.mockResolvedValue(worker);
    cacheModuleMocks.scheduleWorkerKVPostgresCleanup.mockReset();
  });

  it.each(['get', 'set', 'delete'] as const)(
    'surfaces sanitized %s failures through a real Keyv instance',
    async (method) => {
      const kv = createWorkerKVFacade({
        kind: 'worker',
        workspaceId: 'workspace-a',
        workerId: 'worker-a',
      });
      const action =
        method === 'get'
          ? kv.get('user-key')
          : method === 'set'
            ? kv.set('user-key', 'cached-value')
            : kv.delete('user-key');

      await expect(action).rejects.toMatchObject({
        code: 'WORKER_KV_UNAVAILABLE',
        message: 'WORKER_KV_UNAVAILABLE',
      });
      await action.catch((error: Error) => {
        expect(String(error)).not.toContain('secret');
        expect(String(error)).not.toContain('database.internal');
        expect(String(error)).not.toContain('user-key');
        expect(String(error)).not.toContain('cached-value');
      });
    }
  );

  it('fails closed when a real Keyv adapter returns false for a write', async () => {
    const store = Object.assign(new EventEmitter(), {
      namespace: undefined as string | undefined,
      get: vi.fn(async () => undefined),
      set: vi.fn(async () => false),
      delete: vi.fn(async () => false),
      clear: vi.fn(async () => undefined),
    });
    const shared = new Keyv({
      store,
      namespace: 'tianji-cache',
    });
    cacheModuleMocks.getWorkerCacheManager.mockResolvedValue(
      createWorkerCacheManager(shared)
    );
    const kv = createWorkerKVFacade({
      kind: 'worker',
      workspaceId: 'workspace-a',
      workerId: 'worker-a',
    });

    await expect(kv.set('user-key', 'cached-value')).rejects.toMatchObject({
      code: 'WORKER_KV_UNAVAILABLE',
      message: 'WORKER_KV_UNAVAILABLE',
    });
  });
});
