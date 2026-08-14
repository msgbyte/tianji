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
  `${WORKER_KV_KEYV_NAMESPACE}:worker-kv:v1:%`,
  `${WORKER_KV_KEYV_NAMESPACE}:workspace-kv:v1:%`,
  `${WORKER_KV_KEYV_NAMESPACE}:worker-kv-test:v1:%`,
] as const;
const WORKER_KV_POSTGRES_CLEANUP_WARNING =
  '[Worker KV] PostgreSQL expiry cleanup failed';

export function isWorkerKVPostgresStore(store: unknown) {
  return store instanceof KeyvPostgres;
}

type SuccessfulStoreOperation = (store: unknown) => void;

class SharedKeyvStoreAdapter {
  namespace?: string;

  constructor(
    private readonly operationStore: KeyvStoreAdapter | Map<unknown, unknown>,
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
    const value = await (this.operationStore as any).get(key);
    this.reportSuccess();
    return value;
  }

  async set(key: string, value: unknown, ttl?: number) {
    const result = await (this.operationStore as any).set(key, value, ttl);
    if (result !== false) {
      this.reportSuccess();
    }
    return result;
  }

  async delete(key: string) {
    const deleted = await (this.operationStore as any).delete(key);
    this.reportSuccess();
    return deleted;
  }

  async clear() {
    await (this.operationStore as any).clear();
    this.reportSuccess();
  }
}

function createWorkerOperationStore(
  sharedStore: KeyvStoreAdapter | Map<unknown, unknown>
) {
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

    const [privatePrefix, workspacePrefix, testPrefix] =
      WORKER_KV_POSTGRES_PREFIXES;
    const query = Prisma.sql`
      WITH expired_worker_kv AS (
        SELECT "key"
        FROM "cache"."cache"
        WHERE (
          "key" LIKE ${privatePrefix}
          OR "key" LIKE ${workspacePrefix}
          OR "key" LIKE ${testPrefix}
        )
        AND CASE
          WHEN jsonb_typeof("value"::jsonb -> 'expires') = 'number'
          THEN ("value"::jsonb ->> 'expires')::bigint < ${now}
          ELSE false
        END
        ORDER BY "key"
        FOR UPDATE SKIP LOCKED
        LIMIT ${dependencies.batchSize}
      )
      DELETE FROM "cache"."cache" AS target
      USING expired_worker_kv AS expired
      WHERE target."key" = expired."key"
    `;

    let execution: Promise<unknown>;
    try {
      execution = dependencies.execute(query);
    } catch (error) {
      execution = Promise.reject(error);
    }

    const cleanup = execution
      .then(() => undefined)
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
  execute: (query) => prisma.$executeRaw(query),
  now: Date.now,
  intervalMs: WORKER_KV_POSTGRES_CLEANUP_INTERVAL_MS,
  batchSize: WORKER_KV_POSTGRES_CLEANUP_BATCH_SIZE,
  warn: (message) => logger.warn(message),
});

export function scheduleWorkerKVPostgresCleanup(store: unknown) {
  void cleanupWorkerKVPostgres(store);
}
