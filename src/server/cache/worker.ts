import { Prisma } from '@prisma/client';
import Keyv, { type KeyvStoreAdapter } from 'keyv';
import KeyvPostgres from '@keyv/postgres';
import KeyvRedis from '@keyv/redis';
import { prisma } from '../model/_client.js';
import { logger } from '../utils/logger.js';

export const WORKER_KV_KEYV_NAMESPACE = 'tianji-cache';
export const WORKER_KV_POSTGRES_CLEANUP_INTERVAL_MS = 60_000;
export const WORKER_KV_POSTGRES_CLEANUP_BATCH_SIZE = 100;

const WORKER_KV_POSTGRES_PREFIXES = [
  `${WORKER_KV_KEYV_NAMESPACE}:worker-kv:v1:`,
  `${WORKER_KV_KEYV_NAMESPACE}:workspace-kv:v1:`,
  `${WORKER_KV_KEYV_NAMESPACE}:worker-kv-test:v1:`,
] as const;
const WORKER_KV_POSTGRES_CLEANUP_WARNING =
  '[Worker KV] PostgreSQL expiry cleanup failed';

export function isWorkerKVPostgresStore(store: unknown) {
  return store instanceof KeyvPostgres;
}

type SuccessfulStoreOperation = (store: unknown) => void;

interface WorkerOperationStore {
  get(key: string): unknown;
  set(key: string, value: unknown, ttl?: number): unknown;
  delete(key: string): unknown;
  clear(): unknown;
}

class SharedKeyvStoreAdapter {
  namespace?: string;

  constructor(
    private readonly operationStore: WorkerOperationStore,
    private readonly sharedStore: KeyvStoreAdapter | Map<unknown, unknown>,
    private readonly onSuccessfulStoreOperation: SuccessfulStoreOperation
  ) {}

  private reportSuccess() {
    try {
      this.onSuccessfulStoreOperation(this.sharedStore);
    } catch {
      // Maintenance must never change the result of a Worker cache operation.
    }
  }

  async get(key: string) {
    const value = await this.operationStore.get(key);
    this.reportSuccess();
    return value;
  }

  async set(key: string, value: unknown, ttl?: number) {
    const result = await this.operationStore.set(key, value, ttl);
    if (result !== false) {
      this.reportSuccess();
    }
    return result;
  }

  async delete(key: string) {
    const deleted = await this.operationStore.delete(key);
    this.reportSuccess();
    return deleted;
  }

  async clear() {
    await this.operationStore.clear();
    this.reportSuccess();
  }
}

class WorkerMemoryStoreAdapter {
  namespace?: string;
  private readonly expiryTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(private readonly store: Map<unknown, unknown>) {}

  async get(key: string) {
    return this.store.get(key);
  }

  async set(key: string, value: unknown, ttl?: number) {
    this.clearExpiryTimer(key);
    this.store.set(key, value);

    if (typeof ttl === 'number' && ttl > 0) {
      const timer = setTimeout(() => {
        if (this.store.get(key) === value) {
          this.store.delete(key);
        }
        this.expiryTimers.delete(key);
      }, ttl);
      timer.unref?.();
      this.expiryTimers.set(key, timer);
    }

    return true;
  }

  async delete(key: string) {
    this.clearExpiryTimer(key);
    return this.store.delete(key);
  }

  async clear() {
    for (const timer of this.expiryTimers.values()) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();
    this.store.clear();
  }

  private clearExpiryTimer(key: string) {
    const timer = this.expiryTimers.get(key);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.expiryTimers.delete(key);
    }
  }
}

function createWorkerOperationStore(
  sharedStore: KeyvStoreAdapter | Map<unknown, unknown>
) {
  if (sharedStore instanceof Map) {
    return new WorkerMemoryStoreAdapter(sharedStore);
  }

  if (!(sharedStore instanceof KeyvRedis)) {
    return sharedStore;
  }

  return new KeyvRedis(sharedStore.client, {
    namespace: sharedStore.namespace,
    keyPrefixSeparator: sharedStore.keyPrefixSeparator,
    clearBatchSize: sharedStore.clearBatchSize,
    useUnlink: sharedStore.useUnlink,
    noNamespaceAffectsAll: sharedStore.noNamespaceAffectsAll,
    throwOnConnectError: true,
    throwOnErrors: true,
    connectionTimeout: sharedStore.connectionTimeout,
  });
}

export function createWorkerCacheManager(
  shared: Keyv,
  onSuccessfulStoreOperation: SuccessfulStoreOperation = () => {}
): Keyv {
  const operationStore = createWorkerOperationStore(shared.store);
  const store = new SharedKeyvStoreAdapter(
    operationStore,
    shared.store,
    onSuccessfulStoreOperation
  );

  return new Keyv({
    store,
    ttl: shared.ttl,
    namespace: shared.namespace,
    serialize: shared.serialize,
    deserialize: shared.deserialize,
    useKeyPrefix: shared.useKeyPrefix,
    throwOnErrors: true,
  });
}

interface WorkerKVPostgresCleanupDependencies {
  isPostgresStore: (store: unknown) => boolean;
  execute: (query: Prisma.Sql) => Promise<unknown>;
  now: () => number;
  intervalMs: number;
  batchSize: number;
  warn: (message: string) => void;
}

export function createWorkerKVPostgresCleanup(
  dependencies: WorkerKVPostgresCleanupDependencies
) {
  let inFlight: Promise<void> | undefined;
  let nextAllowedAt = Number.NEGATIVE_INFINITY;
  let prefixIndex = 0;
  const cursors = new Map<string, string>();

  return (store: unknown): Promise<void> => {
    if (!dependencies.isPostgresStore(store)) {
      return Promise.resolve();
    }

    if (inFlight) {
      return inFlight;
    }

    const now = dependencies.now();
    if (now < nextAllowedAt) {
      return Promise.resolve();
    }
    nextAllowedAt = now + dependencies.intervalMs;

    const prefix = WORKER_KV_POSTGRES_PREFIXES[prefixIndex];
    const cursor = cursors.get(prefix) ?? prefix;
    const prefixUpperBound = `${prefix}\uffff`;
    const query = Prisma.sql`
      WITH worker_kv_batch AS MATERIALIZED (
        SELECT "key", "value"
        FROM "cache"."cache"
        WHERE "key" > ${cursor}
          AND "key" < ${prefixUpperBound}
        ORDER BY "key"
        LIMIT ${dependencies.batchSize}
        FOR UPDATE SKIP LOCKED
      ), deleted_worker_kv AS (
        DELETE FROM "cache"."cache" AS target
        USING worker_kv_batch AS candidate
        WHERE target."key" = candidate."key"
          AND CASE
            WHEN jsonb_typeof(candidate."value"::jsonb -> 'expires') = 'number'
            THEN (candidate."value"::jsonb ->> 'expires')::bigint < ${now}
            ELSE false
          END
        RETURNING target."key"
      )
      SELECT
        (SELECT "key" FROM worker_kv_batch ORDER BY "key" DESC LIMIT 1) AS "lastKey",
        (SELECT COUNT(*)::int FROM worker_kv_batch) AS "scannedCount",
        (SELECT COUNT(*)::int FROM deleted_worker_kv) AS "deletedCount"
    `;

    let execution: Promise<unknown>;
    try {
      execution = dependencies.execute(query);
    } catch (error) {
      execution = Promise.reject(error);
    }

    const cleanup = execution
      .then((result) => {
        const row = Array.isArray(result) ? result[0] : undefined;
        const lastKey =
          row && typeof row.lastKey === 'string' ? row.lastKey : undefined;
        const scannedCount =
          row && typeof row.scannedCount !== 'undefined'
            ? Number(row.scannedCount)
            : 0;

        if (lastKey !== undefined && scannedCount >= dependencies.batchSize) {
          cursors.set(prefix, lastKey);
        } else {
          cursors.delete(prefix);
          prefixIndex = (prefixIndex + 1) % WORKER_KV_POSTGRES_PREFIXES.length;
        }
      })
      .catch(() => {
        dependencies.warn(WORKER_KV_POSTGRES_CLEANUP_WARNING);
      })
      .finally(() => {
        if (inFlight === cleanup) {
          inFlight = undefined;
        }
      });
    inFlight = cleanup;

    return cleanup;
  };
}

const cleanupWorkerKVPostgres = createWorkerKVPostgresCleanup({
  isPostgresStore: isWorkerKVPostgresStore,
  execute: (query) => prisma.$queryRaw(query),
  now: Date.now,
  intervalMs: WORKER_KV_POSTGRES_CLEANUP_INTERVAL_MS,
  batchSize: WORKER_KV_POSTGRES_CLEANUP_BATCH_SIZE,
  warn: (message) => logger.warn(message),
});

export function scheduleWorkerKVPostgresCleanup(store: unknown) {
  void cleanupWorkerKVPostgres(store);
}
