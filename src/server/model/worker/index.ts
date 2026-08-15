import { FunctionWorkerExecutionStatus, Prisma } from '@prisma/client';
import { runCodeInIVM } from '../../utils/vm/index.js';
import { prisma } from '../_client.js';
import { isPlainObject } from 'lodash-es';
import { logger } from '../../utils/logger.js';
import { buildQueryWithCache } from '../../cache/index.js';
import {
  promWorkerExecutionCounter,
  promWorkerExecutionDuration,
  promWorkerCPUTime,
  promWorkerMemoryUsage,
  promWorkerRequestPayloadSize,
} from '../../utils/prometheus/client.js';
import { createId } from '@paralleldrive/cuid2';
import { createBatchWriter } from '../../utils/batchWriter.js';
import { env } from '../../utils/env.js';
import {
  createWorkerKVFacade,
  WORKER_KV_MAX_KEY_LENGTH,
  WORKER_KV_MAX_VALUE_BYTES,
  type WorkerKVExecutionScope,
  type WorkerKVScope,
} from './kv.js';
import { createSandboxProxy } from '../../utils/vm/sandbox.js';
import { loadWorkerEnvironmentForExecution } from './environment.js';
import { transformWorkerModuleCode } from '../../utils/vm/utils.js';

const execRecordWriter = createBatchWriter<Prisma.FunctionWorkerExecutionCreateManyInput>({
  name: 'WorkerExecution',
  flush: (batch) =>
    prisma.functionWorkerExecution.createMany({ data: batch }).then(() => {}),
});

function shouldStoreWorkerRequestPayload(workerId?: string) {
  if (!workerId) {
    return true;
  }

  return !env.workerExecutionRequestPayloadDisabledWorkerIds.includes(workerId);
}

function getWorkerRequestPayloadSizeBytes(payload: Record<string, any>) {
  try {
    return Buffer.byteLength(JSON.stringify(payload) ?? '', 'utf8');
  } catch {
    return 0;
  }
}

function redactWorkerLogString(value: string, secretValues: string[]) {
  return secretValues.reduce(
    (redacted, secret) => redacted.replaceAll(secret, '[secret]'),
    value
  );
}

function redactWorkerLogValue(value: any, secretValues: string[]): any {
  if (typeof value === 'string') {
    return redactWorkerLogString(value, secretValues);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactWorkerLogValue(item, secretValues));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        redactWorkerLogString(key, secretValues),
        redactWorkerLogValue(item, secretValues),
      ])
    );
  }

  return value;
}

export const { get: getWorker, del: delWorkerCache } = buildQueryWithCache(
  'worker',
  async (workerId: string, workspaceId: string) => {
    const worker = await prisma.functionWorker.findUnique({
      where: {
        id: workerId,
        workspaceId,
      },
    });

    return worker;
  }
);

export interface ExecWorkerOptions {
  scope: WorkerKVExecutionScope;
  requestPayload?: Record<string, any>;
  context?: Record<string, any>;
  environment?: Record<string, string>;
  secretValues?: string[];
}

function createWorkerKVBridge(scope: WorkerKVScope) {
  return Object.assign(Object.create(null), {
    get: scope.get,
    set: async (key: string, encodedValue: unknown, ttl?: number) => {
      let value: unknown;
      if (typeof encodedValue === 'string') {
        try {
          value = JSON.parse(encodedValue);
        } catch {
          value = undefined;
        }
      }

      return scope.set(key, value as never, ttl);
    },
    delete: scope.delete,
  });
}

function isModuleWorkerCode(code: string) {
  return /^\s*export\s/m.test(code);
}

/**
 * execute a worker code in isolated-vm
 */
export async function execWorker(
  code: string,
  options: ExecWorkerOptions
) {
  const workerId =
    options.scope.kind === 'worker' ? options.scope.workerId : undefined;
  const requestPayload = options.requestPayload;
  const context = options.context;
  const workerRequestPayload: Record<string, any> = isPlainObject(requestPayload)
    ? (requestPayload as Record<string, any>)
    : {};
  const workerContext = {
    ...(isPlainObject(context) ? context : {}),
    env: isPlainObject(options.environment) ? options.environment : {},
  };
  const shouldStoreRequestPayload = shouldStoreWorkerRequestPayload(workerId);
  const requestPayloadSizeBytes =
    getWorkerRequestPayloadSizeBytes(workerRequestPayload);
  const secretsToRedact = [
    ...new Set((options.secretValues ?? []).filter(Boolean)),
  ].sort(
    (left, right) => right.length - left.length
  );
  const kv = createWorkerKVFacade(options.scope);
  const workerKVProxy = createSandboxProxy(createWorkerKVBridge(kv));
  const workspaceKVProxy = createSandboxProxy(
    createWorkerKVBridge(kv.workspace)
  );

  try {
    const transformedModuleCode = isModuleWorkerCode(code)
      ? await transformWorkerModuleCode(code)
      : undefined;
    const usesModuleWorker =
      transformedModuleCode !== undefined &&
      /\bmodule\.exports\s*=/.test(transformedModuleCode);
    const executableCode = usesModuleWorker
      ? `
        const __tianjiWorkerModule = (() => {
          const module = { exports: {} };
          const exports = module.exports;
          ${transformedModuleCode}
          return module.exports;
        })();
      `
      : code;
    const {
      logger: logs,
      result,
      error,
      usage,
      cpuTime,
      memoryUsage,
    } = await runCodeInIVM(`
      (async () => {
        (() => {
          const privateBridge = reproxy(globalThis.__workerKV);
          const workspaceBridge = reproxy(globalThis.__workspaceKV);
          delete globalThis.__workerKV;
          delete globalThis.__workspaceKV;

          const objectCreate = Object.create;
          const objectFreeze = Object.freeze;
          const objectGetPrototypeOf = Object.getPrototypeOf;
          const objectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
          const objectGetOwnPropertyNames = Object.getOwnPropertyNames;
          const objectGetOwnPropertySymbols = Object.getOwnPropertySymbols;
          const objectSetPrototypeOf = Object.setPrototypeOf;
          const objectPrototype = Object.prototype;
          const objectHasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
          const ErrorConstructor = Error;
          const StringConstructor = String;
          const ArrayConstructor = Array;
          const arrayIsArray = Array.isArray;
          const arrayPrototype = Array.prototype;
          const NumberConstructor = Number;
          const numberIsFinite = Number.isFinite;
          const numberIsSafeInteger = Number.isSafeInteger;
          const numberToString = Function.prototype.call.bind(Number.prototype.toString);
          const stringCharCodeAt = Function.prototype.call.bind(String.prototype.charCodeAt);
          const jsonStringify = JSON.stringify;
          const reflectApply = Reflect.apply;
          const WeakSetConstructor = WeakSet;
          const weakSetHas = Function.prototype.call.bind(WeakSet.prototype.has);
          const weakSetAdd = Function.prototype.call.bind(WeakSet.prototype.add);
          const weakSetDelete = Function.prototype.call.bind(WeakSet.prototype.delete);
          const allowedErrorCodes = [
            'WORKER_KV_INVALID_KEY',
            'WORKER_KV_INVALID_VALUE',
            'WORKER_KV_INVALID_TTL',
            'WORKER_KV_LIMIT_EXCEEDED',
            'WORKER_KV_TIMEOUT',
            'WORKER_KV_UNAVAILABLE',
          ];

          const sanitizeError = (error) => {
            const message = error && typeof error.message === 'string'
              ? error.message
              : StringConstructor(error);
            for (let index = 0; index < allowedErrorCodes.length; index += 1) {
              const code = allowedErrorCodes[index];
              if (message === code || message === 'Error: ' + code) {
                return code;
              }
            }
            return 'WORKER_KV_UNAVAILABLE';
          };

          const invoke = async (method, args) => {
            try {
              return await reflectApply(method, undefined, args);
            } catch (error) {
              const code = sanitizeError(error);
              const sanitized = new ErrorConstructor(code);
              sanitized.name = 'WorkerKVError';
              sanitized.code = code;
              throw sanitized;
            }
          };

          const invalidValue = objectFreeze(objectCreate(null));

          const hasSerializationHook = (prototype) => {
            let current = prototype;
            while (current !== null) {
              if (objectGetOwnPropertyDescriptor(current, 'toJSON') !== undefined) {
                return true;
              }
              current = objectGetPrototypeOf(current);
            }
            return false;
          };

          const isArrayIndex = (key, length) => {
            const index = NumberConstructor(key);
            return (
              numberIsSafeInteger(index) &&
              index >= 0 &&
              index < length &&
              numberToString(index) === key
            );
          };

          const normalizeValue = (value, activePath) => {
            if (
              value === null ||
              typeof value === 'string' ||
              typeof value === 'boolean'
            ) {
              return value;
            }
            if (typeof value === 'number') {
              return numberIsFinite(value) ? value : invalidValue;
            }
            if (typeof value !== 'object') {
              return invalidValue;
            }
            if (weakSetHas(activePath, value)) {
              return invalidValue;
            }
            weakSetAdd(activePath, value);

            try {
              if (objectGetOwnPropertySymbols(value).length > 0) {
                return invalidValue;
              }
              if (arrayIsArray(value)) {
                const prototype = objectGetPrototypeOf(value);
                if (
                  prototype !== arrayPrototype ||
                  hasSerializationHook(prototype)
                ) {
                  return invalidValue;
                }

                const normalized = new ArrayConstructor(value.length);
                objectSetPrototypeOf(normalized, null);
                const propertyNames = objectGetOwnPropertyNames(value);
                for (let index = 0; index < propertyNames.length; index += 1) {
                  const key = propertyNames[index];
                  if (key === 'length') {
                    continue;
                  }
                  if (!isArrayIndex(key, value.length)) {
                    return invalidValue;
                  }

                  const descriptor = objectGetOwnPropertyDescriptor(value, key);
                  if (descriptor === undefined || !objectHasOwn(descriptor, 'value')) {
                    return invalidValue;
                  }
                  const entry = normalizeValue(descriptor.value, activePath);
                  if (entry === invalidValue) {
                    return invalidValue;
                  }
                  normalized[NumberConstructor(key)] = entry;
                }
                return normalized;
              }

              const prototype = objectGetPrototypeOf(value);
              if (
                (prototype !== objectPrototype && prototype !== null) ||
                hasSerializationHook(prototype)
              ) {
                return invalidValue;
              }

              const normalized = objectCreate(null);
              const propertyNames = objectGetOwnPropertyNames(value);
              for (let index = 0; index < propertyNames.length; index += 1) {
                const key = propertyNames[index];
                const descriptor = objectGetOwnPropertyDescriptor(value, key);
                if (
                  descriptor === undefined ||
                  !descriptor.enumerable ||
                  !objectHasOwn(descriptor, 'value')
                ) {
                  return invalidValue;
                }

                const entry = normalizeValue(descriptor.value, activePath);
                if (entry === invalidValue) {
                  return invalidValue;
                }
                normalized[key] = entry;
              }
              return normalized;
            } catch {
              return invalidValue;
            } finally {
              weakSetDelete(activePath, value);
            }
          };

          const encodeValue = (value) => {
            try {
              const normalized = normalizeValue(value, new WeakSetConstructor());
              if (normalized === invalidValue) {
                return undefined;
              }
              const encoded = jsonStringify(normalized);
              if (typeof encoded !== 'string') {
                return undefined;
              }

              let encodedBytes = 0;
              for (let index = 0; index < encoded.length; index += 1) {
                const codeUnit = stringCharCodeAt(encoded, index);
                if (codeUnit <= 0x7f) {
                  encodedBytes += 1;
                } else if (codeUnit <= 0x7ff) {
                  encodedBytes += 2;
                } else if (
                  codeUnit >= 0xd800 &&
                  codeUnit <= 0xdbff &&
                  index + 1 < encoded.length
                ) {
                  const nextCodeUnit = stringCharCodeAt(encoded, index + 1);
                  if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
                    encodedBytes += 4;
                    index += 1;
                  } else {
                    encodedBytes += 3;
                  }
                } else {
                  encodedBytes += 3;
                }

                if (encodedBytes > ${WORKER_KV_MAX_VALUE_BYTES}) {
                  return undefined;
                }
              }

              return encoded;
            } catch {
              return undefined;
            }
          };

          const encodeKey = (key) =>
            typeof key === 'string' &&
            key.length > 0 &&
            key.length <= ${WORKER_KV_MAX_KEY_LENGTH}
              ? key
              : '';

          const createScope = (bridge) => {
            const scope = objectCreate(null);
            scope.get = (key) => invoke(
              bridge.get,
              [encodeKey(key)]
            );
            scope.set = (key, value, ttl) => invoke(
              bridge.set,
              [
                encodeKey(key),
                encodeValue(value),
                ttl === undefined || typeof ttl === 'number' ? ttl : 0,
              ]
            );
            scope.delete = (key) => invoke(
              bridge.delete,
              [encodeKey(key)]
            );
            return objectFreeze(scope);
          };

          const privateScope = createScope(privateBridge);
          const publicKV = objectCreate(null);
          publicKV.get = privateScope.get;
          publicKV.set = privateScope.set;
          publicKV.delete = privateScope.delete;
          publicKV.workspace = createScope(workspaceBridge);
          globalThis.kv = objectFreeze(publicKV);
        })();

        return (async () => {
          ${executableCode}

          const handler = ${usesModuleWorker ? `(
            typeof __tianjiWorkerModule.default === 'function'
              ? __tianjiWorkerModule.default
              : __tianjiWorkerModule.default &&
                  typeof __tianjiWorkerModule.default.fetch === 'function'
                ? __tianjiWorkerModule.default.fetch
                : typeof __tianjiWorkerModule.fetch === 'function'
                  ? __tianjiWorkerModule.fetch
                  : undefined
          )` : `(typeof fetch === 'function' ? fetch : undefined)`};
          return typeof handler === 'function'
            ? handler(__requestPayload, __workerContext)
            : 'fetch is not defined';
        })();
      })()
    `, {
      __requestPayload: workerRequestPayload,
      __workerContext: workerContext,
      __workerKV: workerKVProxy,
      __workspaceKV: workspaceKVProxy,
    });

    const { used_heap_size } = memoryUsage;

    const payload = {
      id: workerId ? createId() : undefined,
      workerId: workerId || '',
      status: error
        ? FunctionWorkerExecutionStatus.Failed
        : FunctionWorkerExecutionStatus.Success,
      duration: usage,
      memoryUsed: used_heap_size,
      cpuTime,
      requestPayload: shouldStoreRequestPayload ? requestPayload : null,
      responsePayload: result,
      error: error ? String(error) : undefined,
      logs: Array.isArray(logs)
        ? logs.map((log) =>
            log.map(
              (item) => redactWorkerLogValue(item ?? null, secretsToRedact)
            )
          )
        : [],
    };

    // Record Prometheus metrics
    const workerIdLabel = workerId || 'anonymous';
    const statusLabel = error ? 'Failed' : 'Success';

    promWorkerExecutionCounter.labels(workerIdLabel, statusLabel).inc();
    promWorkerExecutionDuration
      .labels(workerIdLabel, statusLabel)
      .observe(usage / 1000); // ms to seconds
    promWorkerCPUTime.labels(workerIdLabel, statusLabel).observe(cpuTime);
    promWorkerMemoryUsage
      .labels(workerIdLabel, statusLabel)
      .observe(used_heap_size);
    promWorkerRequestPayloadSize
      .labels(workerIdLabel, statusLabel)
      .observe(requestPayloadSizeBytes);

    if (workerId) {
      execRecordWriter.enqueue({
        ...payload,
        requestPayload: shouldStoreRequestPayload
          ? payload.requestPayload
          : Prisma.DbNull,
      });
    }

    return payload;
  } catch (e) {
    logger.error('ExecWorker error:', e);

    // Record Prometheus metrics for failure
    const workerIdLabel = workerId || 'anonymous';

    promWorkerExecutionCounter.labels(workerIdLabel, 'Failed').inc();
    promWorkerRequestPayloadSize
      .labels(workerIdLabel, 'Failed')
      .observe(requestPayloadSizeBytes);

    const payload = {
      workerId: workerId || '',
      status: FunctionWorkerExecutionStatus.Failed,
      requestPayload: shouldStoreRequestPayload ? requestPayload : null,
      error: String(e),
      logs: [],
      responsePayload: null,
    };

    if (workerId) {
      execRecordWriter.enqueue({
        ...payload,
        requestPayload: shouldStoreRequestPayload
          ? payload.requestPayload
          : Prisma.DbNull,
      });
    }

    return payload;
  }
}

export async function execStoredWorker(
  worker: { id: string; workspaceId: string; code: string },
  requestPayload?: Record<string, any>,
  context?: Record<string, any>
) {
  const { environment, secretValues } =
    await loadWorkerEnvironmentForExecution(worker.id);

  return execWorker(worker.code, {
    scope: {
      kind: 'worker',
      workspaceId: worker.workspaceId,
      workerId: worker.id,
    },
    requestPayload,
    context,
    environment,
    secretValues,
  });
}
