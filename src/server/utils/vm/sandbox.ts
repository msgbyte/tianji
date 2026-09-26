import axios, { AxiosRequestConfig } from 'axios';
import EventEmitter from 'events';
import ivm, { Context } from 'isolated-vm';
import { env } from '../env.js';

function isTransferable(data: any): data is ivm.Transferable {
  const dataType = typeof data;

  if (data === ivm) {
    return true;
  }

  if (data === null) {
    return true;
  }

  if (
    ['undefined', 'string', 'number', 'boolean', 'function'].includes(dataType)
  ) {
    return true;
  }

  if (dataType !== 'object') {
    return false;
  }

  return (
    data instanceof ivm.Isolate ||
    data instanceof ivm.Context ||
    data instanceof ivm.Script ||
    data instanceof ivm.ExternalCopy ||
    data instanceof ivm.Callback ||
    data instanceof ivm.Reference
  );
}

export function createSandboxProxy(
  obj: Record<string, any>,
  forbiddenKeys: string[] = []
): Record<string, any> {
  return copyObject({
    isProxy: true,
    get: (key: string) => {
      if (forbiddenKeys.includes(key)) {
        return undefined;
      }

      const value = obj[key];

      if (typeof value === 'function') {
        return new ivm.Reference(async (...args: any[]) => {
          const result = (obj[key] as any)(...args);

          if (result && result instanceof Promise) {
            return new Promise(async (resolve, reject) => {
              try {
                const awaitedResult = await result;
                resolve(makeTransferable(awaitedResult));
              } catch (e) {
                reject(e);
              }
            });
          }

          return makeTransferable(result);
        });
      }

      return makeTransferable(value);
    },
  });
}

// Semi-transferable data can be copied with an ivm.ExternalCopy without needing any manipulation.
function isSemiTransferable(data: any) {
  return data instanceof ArrayBuffer;
}

export function copyObject(
  obj: Record<string, any> | any[]
): Record<string, any> | any[] {
  if (Array.isArray(obj)) {
    return obj.map((data) => copyData(data));
  }

  if (obj instanceof Response) {
    return createSandboxProxy(obj, ['clone']);
  }

  if (isSemiTransferable(obj)) {
    return obj;
  }

  if (typeof obj[Symbol.iterator as any] === 'function') {
    return copyObject(Array.from(obj as any));
  }

  if (obj instanceof EventEmitter) {
    return {};
  }

  const keys = Object.keys(obj);

  return {
    ...Object.fromEntries(
      keys.map((key) => {
        const data = obj[key];

        if (typeof data === 'function') {
          return [key, new ivm.Callback((...args: any[]) => obj[key](...args))];
        }

        return [key, copyData(data)];
      })
    ),
  };
}

function copyData<T extends ivm.Transferable | Record<string, any> | any[]>(
  data: T
) {
  return isTransferable(data) ? data : copyObject(data);
}

function makeTransferable(data: any) {
  return isTransferable(data)
    ? data
    : new ivm.ExternalCopy(copyObject(data)).copyInto();
}

interface SandboxGlobals {
  console?: {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
  globals?: Record<string, any>;
  /**
   * Receives one summary line per completed `request()` call, so a later
   * memory-limit failure can point at the response that preceded it.
   */
  requestLog?: string[];
}

function formatBytes(bytes: number | undefined) {
  if (bytes === undefined) return 'unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function byteSize(data: unknown) {
  if (typeof data === 'string') return Buffer.byteLength(data);
  if (Buffer.isBuffer(data)) return data.length;
  return undefined;
}

/**
 * isolated-vm disposes the isolate itself when it hits the memory limit and
 * drops the JS stack, so explain the failure with what the host observed.
 */
export function describeDisposedIsolateError(
  error: unknown,
  requestLog: string[]
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error ?? 'Isolate was disposed during execution');
  const requests = requestLog.length
    ? ` Sandbox requests completed before the failure: ${requestLog.join('; ')}`
    : ' No sandbox request completed before the failure.';
  return new Error(
    `${message} (sandbox memory limit: ${env.sandbox.memoryLimit} MB).${requests}`
  );
}

const defaultSandboxGlobals = {
  console: {
    log: () => {},
    warn: () => {},
    error: () => {},
  },
};

export function buildSandbox(context: Context, globals: SandboxGlobals = {}) {
  const jail = context.global;
  jail.setSync('global', jail.derefInto());
  jail.setSync('_ivm', ivm);
  for (const [key, value] of Object.entries(globals.globals ?? {})) {
    jail.setSync(key, makeTransferable(value));
  }
  jail.setSync(
    'console',
    makeTransferable(globals.console ?? defaultSandboxGlobals)
  );
  jail.setSync(
    '_request',
    new ivm.Reference(async (config: AxiosRequestConfig) => {
      let responseBytes: number | undefined;
      const result = await axios.request({
        ...config,
        // Count the raw body before axios parses it, so logging the size never
        // re-serializes parsed JSON on the main thread.
        transformResponse: [
          (data) => {
            responseBytes = byteSize(data);
            return data;
          },
          ...[axios.defaults.transformResponse ?? []].flat(),
        ],
      });
      globals.requestLog?.push(
        `${(config.method ?? 'GET').toUpperCase()} ${
          axios.getUri(config).split('?')[0]
        } -> ${result.status}, ${formatBytes(responseBytes)}`
      );

      return makeTransferable({
        headers: { ...result.headers },
        data: result.data,
        status: result.status,
      });
    })
  );
}

export const environmentScript = `
const reproxy = (reference) => {
  return new Proxy(reference, {
    get(target, p, receiver) {
      if (target !== reference || p === 'then') {
        return Reflect.get(target, p, receiver);
      }

      const data = reference.get(p);

      if (typeof data === 'object' && data instanceof _ivm.Reference && data.typeof === 'function') {
        return (...args) => data.apply(undefined, args, { arguments: { copy: true }, result: { promise: true } });
      }

      return data;
    }
  });
};

const request = async (...args) => {
  const result = await _request.apply(undefined, args, { arguments: { copy: true }, result: { promise: true } });

  if (result && typeof result === 'object' && result.isProxy) {
    return reproxy(result);
  }

  return result;
};

(() => {
  const consoleBridge = globalThis.console;
  const bridgeLog = consoleBridge.log;
  const bridgeWarn = consoleBridge.warn;
  const bridgeError = consoleBridge.error;
  const arrayIsArray = Array.isArray;
  const arrayBufferIsView = ArrayBuffer.isView;
  const objectCreate = Object.create;
  const objectFreeze = Object.freeze;
  const objectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  const objectKeys = Object.keys;
  const objectToString = Function.prototype.call.bind(Object.prototype.toString);
  const reflectApply = Reflect.apply;
  const stringConstructor = String;
  const weakSetDelete = Function.prototype.call.bind(WeakSet.prototype.delete);
  const weakSetHas = Function.prototype.call.bind(WeakSet.prototype.has);
  const weakSetAdd = Function.prototype.call.bind(WeakSet.prototype.add);

  const formatFunction = (value) => {
    let kind = 'Function';
    let name = '';
    try {
      const tag = objectToString(value);
      kind = tag.slice(8, -1) || kind;
      name = typeof value.name === 'string' ? value.name : '';
    } catch {}
    return '[' + kind + (name ? ': ' + name : '') + ']';
  };
  const readProperty = (value, key, seen, depth) => {
    const descriptor = objectGetOwnPropertyDescriptor(value, key);
    if (!descriptor) {
      return undefined;
    }
    if ('value' in descriptor) {
      return copyLogValue(descriptor.value, seen, depth);
    }
    if (descriptor.get && descriptor.set) {
      return '[Getter/Setter]';
    }
    return descriptor.get ? '[Getter]' : '[Setter]';
  };
  const copyLogValue = (value, seen, depth) => {
    const valueType = typeof value;
    if (valueType === 'function') {
      return formatFunction(value);
    }
    if (valueType === 'bigint') {
      return stringConstructor(value) + 'n';
    }
    if (valueType === 'symbol') {
      return stringConstructor(value);
    }
    if (value === null || valueType !== 'object') {
      return value;
    }
    if (depth >= 8) {
      return '[Max Depth]';
    }
    if (weakSetHas(seen, value)) {
      return '[Circular]';
    }

    weakSetAdd(seen, value);
    try {
      if (arrayIsArray(value)) {
        const result = [];
        const length = Math.min(value.length, 100);
        for (let index = 0; index < length; index += 1) {
          result.push(readProperty(value, stringConstructor(index), seen, depth + 1));
        }
        if (value.length > length) {
          result.push('[Truncated ' + (value.length - length) + ' items]');
        }
        return result;
      }

      const tag = objectToString(value);
      if (tag === '[object ArrayBuffer]' || arrayBufferIsView(value)) {
        return value;
      }
      if (tag === '[object Date]') {
        return stringConstructor(value);
      }
      if (tag === '[object RegExp]') {
        return stringConstructor(value);
      }

      const result = objectCreate(null);
      if (tag.endsWith('Error]')) {
        result.name = readProperty(value, 'name', seen, depth + 1) || tag.slice(8, -1);
        result.message = readProperty(value, 'message', seen, depth + 1) || '';
        const stack = readProperty(value, 'stack', seen, depth + 1);
        if (stack !== undefined) {
          result.stack = stack;
        }
      }

      const keys = objectKeys(value);
      const length = Math.min(keys.length, 100);
      for (let index = 0; index < length; index += 1) {
        const key = keys[index];
        result[key] = readProperty(value, key, seen, depth + 1);
      }
      if (keys.length > length) {
        result.__truncated__ = keys.length - length;
      }
      return result;
    } catch (error) {
      return '[Unserializable: ' + (error && error.message ? error.message : 'unknown') + ']';
    } finally {
      weakSetDelete(seen, value);
    }
  };
  const write = (bridge, args) => {
    const copiedArgs = [];
    const seen = new WeakSet();
    for (let index = 0; index < args.length; index += 1) {
      copiedArgs.push(copyLogValue(args[index], seen, 0));
    }
    return reflectApply(bridge, undefined, copiedArgs);
  };

  globalThis.console = objectFreeze(objectCreate(null, {
    log: { value: (...args) => write(bridgeLog, args), enumerable: true },
    warn: { value: (...args) => write(bridgeWarn, args), enumerable: true },
    error: { value: (...args) => write(bridgeError, args), enumerable: true },
  }));
})();
`;
