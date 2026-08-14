import { describe, expect, it, vi } from 'vitest';
import { createWorkerKVFacade } from './kv.js';

function createCache() {
  const values = new Map<string, unknown>();
  return {
    values,
    cache: {
      get: vi.fn(async (key: string) => values.get(key)),
      set: vi.fn(async (key: string, value: unknown, ttl?: number) => {
        values.set(key, value);
        return true;
      }),
      delete: vi.fn(async (key: string) => values.delete(key)),
    },
  };
}

function createFacade(cache = createCache().cache) {
  return createWorkerKVFacade(
    { kind: 'worker', workspaceId: 'workspace-a', workerId: 'worker-a' },
    { getCacheManager: async () => cache as any }
  );
}

describe('createWorkerKVFacade', () => {
  it('stores private and workspace values in isolated JSON namespaces', async () => {
    const { cache } = createCache();
    const kv = createFacade(cache);

    await kv.set('state', { count: 1 });
    expect(cache.set).toHaveBeenCalledWith(
      'worker-kv:v1:workspace-a:worker-a:dad186f4c202034323be080a40febbd1f2655343ce274f085df8459ec8094dc6',
      JSON.stringify({ count: 1 }),
      10 * 60 * 1000
    );
    expect(await kv.get('state')).toEqual({ count: 1 });

    await kv.workspace.set('token', 'shared', 1_000);
    expect(cache.set).toHaveBeenLastCalledWith(
      'workspace-kv:v1:workspace-a:68d7e994d91be4f25f36860f72027e3d9903d3d827faf143402b43b6df2e4e8b',
      JSON.stringify('shared'),
      1_000
    );
  });

  it('keeps private keys isolated by worker and workspace keys isolated by workspace', async () => {
    const { cache } = createCache();
    const first = createFacade(cache);
    const secondWorker = createWorkerKVFacade(
      { kind: 'worker', workspaceId: 'workspace-a', workerId: 'worker-b' },
      { getCacheManager: async () => cache as any }
    );
    const secondWorkspace = createWorkerKVFacade(
      { kind: 'worker', workspaceId: 'workspace-b', workerId: 'worker-a' },
      { getCacheManager: async () => cache as any }
    );

    await first.set('state', 'private');
    await first.workspace.set('shared', 'workspace-a');

    expect(await secondWorker.get('state')).toBeUndefined();
    expect(await secondWorkspace.workspace.get('shared')).toBeUndefined();
  });

  it('isolates both test scopes under their execution IDs', async () => {
    const { cache } = createCache();
    const first = createWorkerKVFacade(
      { kind: 'test', workspaceId: 'workspace-a', executionId: 'execution-a' },
      { getCacheManager: async () => cache as any }
    );
    const second = createWorkerKVFacade(
      { kind: 'test', workspaceId: 'workspace-a', executionId: 'execution-b' },
      { getCacheManager: async () => cache as any }
    );

    await first.set('state', 'private');
    await first.workspace.set('shared', 'workspace');

    expect(cache.set).toHaveBeenNthCalledWith(
      1,
      'worker-kv-test:v1:workspace-a:execution-a:private:dad186f4c202034323be080a40febbd1f2655343ce274f085df8459ec8094dc6',
      JSON.stringify('private'),
      10 * 60 * 1000
    );
    expect(cache.set).toHaveBeenNthCalledWith(
      2,
      'worker-kv-test:v1:workspace-a:execution-a:workspace:f4a9c3550ea6fd37b8ac7f0c69ee5a5feda055548ccd392d26f0104cd32049f0',
      JSON.stringify('workspace'),
      10 * 60 * 1000
    );
    expect(await second.get('state')).toBeUndefined();
    expect(await second.workspace.get('shared')).toBeUndefined();
  });

  it('returns latest writes, preserves falsy JSON values, and deletes values', async () => {
    const kv = createFacade();

    await kv.set('key', 'first');
    await kv.set('key', 'second');
    await kv.set('null', null);
    await kv.set('false', false);
    await kv.set('zero', 0);
    await kv.set('empty', '');

    expect(await kv.get('key')).toBe('second');
    expect(await kv.get('null')).toBeNull();
    expect(await kv.get('false')).toBe(false);
    expect(await kv.get('zero')).toBe(0);
    expect(await kv.get('empty')).toBe('');
    expect(await kv.get('missing')).toBeUndefined();
    expect(await kv.delete('key')).toBe(true);
    expect(await kv.delete('key')).toBe(false);
  });

  it('rejects invalid keys, values, and TTLs with stable codes', async () => {
    const kv = createFacade();

    await expect(kv.get('')).rejects.toMatchObject({
      code: 'WORKER_KV_INVALID_KEY',
    });
    await expect(kv.get('x'.repeat(257))).rejects.toMatchObject({
      code: 'WORKER_KV_INVALID_KEY',
    });
    const invalidValues = [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      undefined,
      () => undefined,
      Symbol('invalid'),
      1n,
      new Date(),
      new Uint8Array([1, 2, 3]),
      new (class CustomValue {
        count = 1;
      })(),
    ];
    for (const value of invalidValues) {
      await expect(kv.set('key', value as any)).rejects.toMatchObject({
        code: 'WORKER_KV_INVALID_VALUE',
      });
    }
    await expect(kv.set('key', 'value', 999)).rejects.toMatchObject({
      code: 'WORKER_KV_INVALID_TTL',
    });
    await expect(kv.set('key', 'value', 86_400_001)).rejects.toMatchObject({
      code: 'WORKER_KV_INVALID_TTL',
    });
  });

  it('accepts the exact minimum and maximum TTL boundaries', async () => {
    const { cache } = createCache();
    const kv = createFacade(cache);

    await kv.set('minimum', 'value', 1_000);
    await kv.workspace.set('maximum', 'value', 86_400_000);

    expect(cache.set.mock.calls.map((call) => call[2])).toEqual([
      1_000,
      86_400_000,
    ]);
  });

  it('rejects cyclic and oversized values before writing them', async () => {
    const { cache } = createCache();
    const kv = createFacade(cache);
    const cyclic: any = {};
    cyclic.self = cyclic;

    await expect(kv.set('cyclic', cyclic)).rejects.toMatchObject({
      code: 'WORKER_KV_INVALID_VALUE',
    });
    await expect(kv.set('large', 'x'.repeat(256 * 1024))).rejects.toMatchObject({
      code: 'WORKER_KV_INVALID_VALUE',
    });
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('accepts repeated references that are not cyclic', async () => {
    const kv = createFacade();
    const shared = { count: 1 };

    await kv.set('repeated', { first: shared, second: shared });

    await expect(kv.get('repeated')).resolves.toEqual({
      first: { count: 1 },
      second: { count: 1 },
    });
  });

  it('rejects hidden serialization hooks before they can transform a value', async () => {
    const { cache } = createCache();
    const kv = createFacade(cache);
    const value = { original: true };
    Object.defineProperty(value, 'toJSON', {
      value: () => ({ transformed: true }),
    });

    await expect(kv.set('hidden-hook', value)).rejects.toMatchObject({
      code: 'WORKER_KV_INVALID_VALUE',
    });
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('keeps distinct accepted UTF-16 key strings physically distinct', async () => {
    const { cache } = createCache();
    const kv = createFacade(cache);

    await kv.set('\ud800', 'first');
    await kv.set('\ud801', 'second');

    expect(cache.set.mock.calls[0][0]).not.toBe(cache.set.mock.calls[1][0]);
  });

  it('treats a false backend write result as unavailable', async () => {
    const cache = {
      get: vi.fn(),
      set: vi.fn(async () => false),
      delete: vi.fn(),
    };
    const kv = createFacade(cache);

    await expect(kv.set('key', 'value')).rejects.toMatchObject({
      code: 'WORKER_KV_UNAVAILABLE',
    });
  });

  it('limits all private and workspace calls to one shared execution budget', async () => {
    const kv = createFacade();

    for (let index = 0; index < 49; index += 1) {
      await kv.get(`key-${index}`);
    }
    await kv.workspace.get('last');
    await expect(kv.get('overflow')).rejects.toMatchObject({
      code: 'WORKER_KV_LIMIT_EXCEEDED',
    });
  });

  it('counts rejected validation calls against the execution call budget', async () => {
    const kv = createFacade();

    await expect(kv.get('')).rejects.toMatchObject({
      code: 'WORKER_KV_INVALID_KEY',
    });
    for (let index = 0; index < 49; index += 1) {
      await kv.get(`key-${index}`);
    }
    await expect(kv.get('overflow')).rejects.toMatchObject({
      code: 'WORKER_KV_LIMIT_EXCEEDED',
    });
  });

  it('limits total serialized writes for the whole execution', async () => {
    const kv = createFacade();
    const stringWithSerializedBytes = (bytes: number) => 'x'.repeat(bytes - 2);

    for (let index = 0; index < 4; index += 1) {
      await kv.set(`chunk-${index}`, stringWithSerializedBytes(256 * 1024));
    }
    await expect(kv.workspace.set('overflow', '')).rejects.toMatchObject({
      code: 'WORKER_KV_LIMIT_EXCEEDED',
    });
  });

  it('times out backend operations', async () => {
    const cache = {
      get: vi.fn(() => new Promise(() => undefined)),
      set: vi.fn(),
      delete: vi.fn(),
    };
    const kv = createWorkerKVFacade(
      { kind: 'worker', workspaceId: 'workspace-a', workerId: 'worker-a' },
      { getCacheManager: async () => cache as any, operationTimeoutMs: 10 }
    );

    await expect(kv.get('slow')).rejects.toMatchObject({
      code: 'WORKER_KV_TIMEOUT',
    });
  });

  it.each(['get', 'set', 'delete'] as const)(
    'sanitizes backend %s failures',
    async (method) => {
      const secret = 'redis://user:secret@cache.internal';
      const cache = {
        get: vi.fn(async () => {
          if (method === 'get') throw new Error(secret);
          return undefined;
        }),
        set: vi.fn(async () => {
          if (method === 'set') throw new Error(secret);
          return true;
        }),
        delete: vi.fn(async () => {
          if (method === 'delete') throw new Error(secret);
          return false;
        }),
      };
      const kv = createFacade(cache);
      const action =
        method === 'get'
          ? kv.get('user-key')
          : method === 'set'
            ? kv.set('user-key', 'cached-value')
            : kv.delete('user-key');

      await expect(action).rejects.toMatchObject({
        code: 'WORKER_KV_UNAVAILABLE',
      });
      await action.catch((error: Error) => {
        expect(error.message).toBe('WORKER_KV_UNAVAILABLE');
        expect(error.message).not.toContain('secret');
        expect(error.message).not.toContain('cache.internal');
        expect(error.message).not.toContain('user-key');
        expect(error.message).not.toContain('cached-value');
      });
    }
  );
});
