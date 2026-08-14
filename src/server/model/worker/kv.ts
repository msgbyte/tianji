import { getCacheManager } from '../../cache/index.js';

export const WORKER_KV_DEFAULT_TTL_MS = 10 * 60 * 1000;
export const WORKER_KV_MIN_TTL_MS = 1_000;
export const WORKER_KV_MAX_TTL_MS = 24 * 60 * 60 * 1000;
export const WORKER_KV_MAX_KEY_LENGTH = 256;
export const WORKER_KV_MAX_VALUE_BYTES = 256 * 1024;
export const WORKER_KV_MAX_CALLS = 50;
export const WORKER_KV_MAX_WRITE_BYTES = 1024 * 1024;
export const WORKER_KV_OPERATION_TIMEOUT_MS = 2_000;

export type WorkerKVValue =
  | null
  | string
  | number
  | boolean
  | WorkerKVValue[]
  | { [key: string]: WorkerKVValue };

export type WorkerKVExecutionScope =
  | { kind: 'worker'; workspaceId: string; workerId: string }
  | { kind: 'test'; workspaceId: string; executionId: string };

export interface WorkerKVScope {
  get<T extends WorkerKVValue = WorkerKVValue>(
    key: string
  ): Promise<T | undefined>;
  set(key: string, value: WorkerKVValue, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
}

export interface WorkerKVFacade extends WorkerKVScope {
  workspace: WorkerKVScope;
}

export type WorkerKVErrorCode =
  | 'WORKER_KV_INVALID_KEY'
  | 'WORKER_KV_INVALID_VALUE'
  | 'WORKER_KV_INVALID_TTL'
  | 'WORKER_KV_LIMIT_EXCEEDED'
  | 'WORKER_KV_TIMEOUT'
  | 'WORKER_KV_UNAVAILABLE';

export class WorkerKVError extends Error {
  constructor(public readonly code: WorkerKVErrorCode) {
    super(code);
    this.name = 'WorkerKVError';
  }
}

type WorkerKVDependencies = {
  getCacheManager?: typeof getCacheManager;
  operationTimeoutMs?: number;
};

function validateKey(key: string) {
  if (
    typeof key !== 'string' ||
    key.length === 0 ||
    key.length > WORKER_KV_MAX_KEY_LENGTH
  ) {
    throw new WorkerKVError('WORKER_KV_INVALID_KEY');
  }
}

function validateValue(value: unknown, visited = new WeakSet<object>()): value is WorkerKVValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return true;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value !== 'object') {
    return false;
  }

  if (visited.has(value)) {
    return false;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    return value.every((entry) => validateValue(entry, visited));
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return false;
  }

  return Object.values(value).every((entry) => validateValue(entry, visited));
}

function validateTtl(ttl: number | undefined) {
  if (
    ttl !== undefined &&
    (!Number.isSafeInteger(ttl) ||
      ttl < WORKER_KV_MIN_TTL_MS ||
      ttl > WORKER_KV_MAX_TTL_MS)
  ) {
    throw new WorkerKVError('WORKER_KV_INVALID_TTL');
  }
}

function encodeValue(value: WorkerKVValue) {
  if (!validateValue(value)) {
    throw new WorkerKVError('WORKER_KV_INVALID_VALUE');
  }

  let encoded: string;
  try {
    encoded = JSON.stringify(value);
  } catch {
    throw new WorkerKVError('WORKER_KV_INVALID_VALUE');
  }

  if (Buffer.byteLength(encoded) > WORKER_KV_MAX_VALUE_BYTES) {
    throw new WorkerKVError('WORKER_KV_INVALID_VALUE');
  }

  return encoded;
}

export function createWorkerKVFacade(
  scope: WorkerKVExecutionScope,
  dependencies: WorkerKVDependencies = {}
): WorkerKVFacade {
  const cacheManager = dependencies.getCacheManager ?? getCacheManager;
  const operationTimeoutMs =
    dependencies.operationTimeoutMs ?? WORKER_KV_OPERATION_TIMEOUT_MS;
  const privatePrefix =
    scope.kind === 'worker'
      ? `worker-kv:v1:${scope.workspaceId}:${scope.workerId}:`
      : `worker-kv-test:v1:${scope.workspaceId}:${scope.executionId}:private:`;
  const workspacePrefix =
    scope.kind === 'worker'
      ? `workspace-kv:v1:${scope.workspaceId}:`
      : `worker-kv-test:v1:${scope.workspaceId}:${scope.executionId}:workspace:`;
  const budget = { calls: 0, writeBytes: 0 };

  function consumeCall() {
    budget.calls += 1;
    if (budget.calls > WORKER_KV_MAX_CALLS) {
      throw new WorkerKVError('WORKER_KV_LIMIT_EXCEEDED');
    }
  }

  function consumeWrite(bytes: number) {
    if (budget.writeBytes + bytes > WORKER_KV_MAX_WRITE_BYTES) {
      throw new WorkerKVError('WORKER_KV_LIMIT_EXCEEDED');
    }
    budget.writeBytes += bytes;
  }

  async function runBackend<T>(operation: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new WorkerKVError('WORKER_KV_TIMEOUT')),
            operationTimeoutMs
          );
        }),
      ]);
    } catch (error) {
      if (error instanceof WorkerKVError) {
        throw error;
      }
      throw new WorkerKVError('WORKER_KV_UNAVAILABLE');
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }

  function createScope(prefix: string): WorkerKVScope {
    return {
      async get<T extends WorkerKVValue = WorkerKVValue>(key: string) {
        consumeCall();
        validateKey(key);

        const cache = await runBackend(cacheManager());
        const cached = await runBackend(cache.get(`${prefix}${key}`));
        if (cached === undefined) {
          return undefined;
        }

        try {
          return JSON.parse(String(cached)) as T;
        } catch {
          throw new WorkerKVError('WORKER_KV_UNAVAILABLE');
        }
      },

      async set(key: string, value: WorkerKVValue, ttl?: number) {
        consumeCall();
        validateKey(key);
        validateTtl(ttl);
        const encoded = encodeValue(value);
        consumeWrite(Buffer.byteLength(encoded));

        const cache = await runBackend(cacheManager());
        await runBackend(
          cache.set(
            `${prefix}${key}`,
            encoded,
            ttl ?? WORKER_KV_DEFAULT_TTL_MS
          )
        );
      },

      async delete(key: string) {
        consumeCall();
        validateKey(key);

        const cache = await runBackend(cacheManager());
        return runBackend(cache.delete(`${prefix}${key}`));
      },
    };
  }

  const privateScope = createScope(privatePrefix);
  return { ...privateScope, workspace: createScope(workspacePrefix) };
}
