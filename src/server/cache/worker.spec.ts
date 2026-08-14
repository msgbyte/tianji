import EventEmitter from 'node:events';
import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';
import KeyvRedis from '@keyv/redis';
import { describe, expect, it, vi } from 'vitest';
import {
  createWorkerCacheManager,
  createWorkerKVPostgresCleanup,
  isWorkerKVPostgresStore,
} from './worker.js';

describe('createWorkerCacheManager', () => {
  it('shares the configured store and namespace without changing shared error behavior', async () => {
    const store = new Map() as Map<unknown, unknown> & {
      namespace?: string;
    };
    const shared = new Keyv({
      store,
      namespace: 'tianji-cache',
    });
    const sharedStoreNamespace = store.namespace;

    const worker = createWorkerCacheManager(shared);

    expect(worker.store).not.toBe(shared.store);
    expect(worker.namespace).toBe('tianji-cache');
    expect(worker.throwOnErrors).toBe(true);
    expect(shared.throwOnErrors).toBe(false);
    expect(store.namespace).toBe(sharedStoreNamespace);

    await worker.set('worker-key', 'value');
    await expect(shared.get('worker-key')).resolves.toBe('value');
  });

  it('keeps successful operations valid when maintenance throws', async () => {
    const shared = new Keyv({
      store: new Map(),
      namespace: 'tianji-cache',
    });
    const maintenance = vi.fn(() => {
      throw new Error('database details');
    });
    const worker = createWorkerCacheManager(shared, maintenance);

    await expect(worker.set('key', 'value')).resolves.toBe(true);
    await expect(worker.get('key')).resolves.toBe('value');
    await expect(worker.delete('key')).resolves.toBe(true);
    expect(maintenance).toHaveBeenCalledTimes(3);
  });

  it.each(['get', 'set', 'delete'] as const)(
    'uses a strict Redis adapter view for %s without mutating the shared adapter',
    async (method) => {
      const client = Object.assign(new EventEmitter(), {
        isOpen: true,
        options: { url: 'redis://cache.internal' },
        connect: vi.fn(),
        get: vi.fn(async () => {
          throw new Error('redis unavailable');
        }),
        set: vi.fn(async () => {
          throw new Error('redis unavailable');
        }),
        del: vi.fn(async () => {
          throw new Error('redis unavailable');
        }),
        unlink: vi.fn(async () => {
          throw new Error('redis unavailable');
        }),
      });
      const sharedStore = new KeyvRedis(client as any, {
        throwOnErrors: false,
      });
      const shared = new Keyv({
        store: sharedStore,
        namespace: 'tianji-cache',
      });

      const worker = createWorkerCacheManager(shared);
      const action =
        method === 'get'
          ? worker.get('key')
          : method === 'set'
            ? worker.set('key', 'value')
            : worker.delete('key');

      await expect(action).rejects.toThrow('redis unavailable');
      expect(worker.store).not.toBe(sharedStore);
      expect(client.connect).not.toHaveBeenCalled();
      expect(sharedStore.throwOnErrors).toBe(false);
      expect(shared.throwOnErrors).toBe(false);
    }
  );
});

describe('createWorkerKVPostgresCleanup', () => {
  it('gates the production cleanup to the PostgreSQL adapter type', () => {
    const postgresStore = Object.setPrototypeOf(
      new EventEmitter(),
      KeyvPostgres.prototype
    );
    const redisStore = new KeyvRedis(
      Object.assign(new EventEmitter(), {
        isOpen: true,
        connect: vi.fn(),
      }) as any
    );

    expect(isWorkerKVPostgresStore(postgresStore)).toBe(true);
    expect(isWorkerKVPostgresStore(redisStore)).toBe(false);
    expect(isWorkerKVPostgresStore(new Map())).toBe(false);
  });

  it('reports the original PostgreSQL adapter after a successful Worker operation', async () => {
    const postgresStore = Object.setPrototypeOf(
      new EventEmitter(),
      KeyvPostgres.prototype
    ) as KeyvPostgres;
    postgresStore.ttlSupport = false;
    postgresStore.opts = {
      dialect: 'postgres',
      uri: 'postgresql://adapter-boundary',
      schema: 'cache',
      table: 'cache',
    };
    postgresStore.query = vi.fn(async () => []);
    const shared = new Keyv({
      store: postgresStore,
      namespace: 'tianji-cache',
    });
    const maintenance = vi.fn();
    const worker = createWorkerCacheManager(shared, maintenance);

    await worker.set('worker-key', 'value');

    expect(maintenance).toHaveBeenCalledWith(postgresStore);
    expect(isWorkerKVPostgresStore(maintenance.mock.calls[0][0])).toBe(true);
  });

  it('gates PostgreSQL and issues a bounded prefix-restricted expiry delete', async () => {
    const postgresStore = {};
    const execute = vi.fn(async (_query: unknown) => 3);
    const cleanup = createWorkerKVPostgresCleanup({
      isPostgresStore: (store) => store === postgresStore,
      execute,
      now: () => 1_765_843_200_000,
      intervalMs: 60_000,
      batchSize: 100,
      warn: vi.fn(),
    });

    await cleanup({});
    expect(execute).not.toHaveBeenCalled();

    await cleanup(postgresStore);

    expect(execute).toHaveBeenCalledTimes(1);
    const query = execute.mock.calls[0][0] as {
      strings: readonly string[];
      values: readonly unknown[];
    };
    const sql = query.strings.join('?').replace(/\s+/g, ' ').trim();

    expect(sql).toContain('DELETE FROM "cache"."cache"');
    expect(sql).toContain(
      'WHERE ( "key" LIKE ? OR "key" LIKE ? OR "key" LIKE ? )'
    );
    expect(sql).toContain(
      "WHEN jsonb_typeof(\"value\"::jsonb -> 'expires') = 'number'"
    );
    expect(sql).toContain(
      'THEN ("value"::jsonb ->> \'expires\')::bigint < ?'
    );
    expect(sql).toContain('LIMIT ?');
    expect(sql).toContain('FOR UPDATE SKIP LOCKED');
    expect(query.values).toEqual([
      'tianji-cache:worker-kv:v1:%',
      'tianji-cache:workspace-kv:v1:%',
      'tianji-cache:worker-kv-test:v1:%',
      1_765_843_200_000,
      100,
    ]);
  });

  it('rate limits attempts and shares one in-flight cleanup', async () => {
    const postgresStore = {};
    let currentTime = 10_000;
    let resolveExecution: (() => void) | undefined;
    const execute = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveExecution = resolve;
        })
    );
    const cleanup = createWorkerKVPostgresCleanup({
      isPostgresStore: (store) => store === postgresStore,
      execute,
      now: () => currentTime,
      intervalMs: 60_000,
      batchSize: 100,
      warn: vi.fn(),
    });

    const first = cleanup(postgresStore);
    const concurrent = cleanup(postgresStore);

    expect(concurrent).toBe(first);
    expect(execute).toHaveBeenCalledTimes(1);
    resolveExecution?.();
    await first;

    currentTime += 59_999;
    await cleanup(postgresStore);
    expect(execute).toHaveBeenCalledTimes(1);

    currentTime += 1;
    const next = cleanup(postgresStore);
    expect(execute).toHaveBeenCalledTimes(2);
    resolveExecution?.();
    await next;
  });

  it('contains cleanup failures behind a stable generic warning', async () => {
    const postgresStore = {};
    const warn = vi.fn();
    const cleanup = createWorkerKVPostgresCleanup({
      isPostgresStore: (store) => store === postgresStore,
      execute: vi.fn(async () => {
        throw new Error('postgresql://user:secret@database.internal/tianji');
      }),
      now: () => 10_000,
      intervalMs: 60_000,
      batchSize: 100,
      warn,
    });

    await expect(cleanup(postgresStore)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      '[Worker KV] PostgreSQL expiry cleanup failed'
    );
    expect(String(warn.mock.calls[0])).not.toContain('secret');
    expect(String(warn.mock.calls[0])).not.toContain('database.internal');
  });
});
