import { beforeAll, describe, expect, it } from 'vitest';
import { env } from '../../utils/env.js';
import { execWorker } from './index.js';

let executionIndex = 0;

async function executeKVWorker(code: string) {
  executionIndex += 1;
  return execWorker(code, {
    scope: {
      kind: 'test',
      workspaceId: 'workspace-ivm',
      executionId: `execution-${executionIndex}`,
    },
    requestPayload: {},
    context: { type: 'test' },
  });
}

describe('Worker KV isolated-vm bridge', () => {
  beforeAll(() => {
    env.cache.memoryOnly = true;
    env.enableFunctionWorkerTypescriptSupport = false;
  });

  it('persists valid objects and repeated references through execWorker', async () => {
    const execution = await executeKVWorker(`
      async function fetch() {
        const shared = { count: 1 };
        await kv.set('repeated', { first: shared, second: shared });
        return kv.get('repeated');
      }
    `);

    expect(execution.error).toBeUndefined();
    expect(execution.responsePayload).toEqual({
      first: { count: 1 },
      second: { count: 1 },
    });
  });

  it('keeps private and workspace bridges separate through execWorker', async () => {
    const execution = await executeKVWorker(`
      async function fetch() {
        await kv.set('same-key', 'private');
        await kv.workspace.set('same-key', 'workspace');
        return {
          privateValue: await kv.get('same-key'),
          workspaceValue: await kv.workspace.get('same-key'),
        };
      }
    `);

    expect(execution.error).toBeUndefined();
    expect(execution.responsePayload).toEqual({
      privateValue: 'private',
      workspaceValue: 'workspace',
    });
  });

  it('rejects non-JSON isolate values with only the stable error code', async () => {
    const execution = await executeKVWorker(`
      async function fetch() {
        const cycle = {};
        cycle.self = cycle;
        class CustomValue {
          constructor() {
            this.count = 1;
          }
        }
        const cases = [
          ['function', { nested: () => 1 }],
          ['class', new CustomValue()],
          ['cycle', cycle],
          ['symbol', { value: Symbol('invalid') }],
          ['bigint', { count: 1n }],
          ['non-finite', { count: Infinity }],
          ['binary', new Uint8Array([1, 2, 3])],
        ];
        const results = [];

        for (const [key, value] of cases) {
          try {
            await kv.set(key, value);
            results.push('accepted');
          } catch (error) {
            results.push(String(error && error.message ? error.message : error));
          }
        }

        return results;
      }
    `);

    expect(execution.error).toBeUndefined();
    expect(execution.responsePayload).toEqual([
      'WORKER_KV_INVALID_VALUE',
      'WORKER_KV_INVALID_VALUE',
      'WORKER_KV_INVALID_VALUE',
      'WORKER_KV_INVALID_VALUE',
      'WORKER_KV_INVALID_VALUE',
      'WORKER_KV_INVALID_VALUE',
      'WORKER_KV_INVALID_VALUE',
    ]);
  });

  it('rejects own and inherited serialization hooks before encoding', async () => {
    const execution = await executeKVWorker(`
      async function fetch() {
        const results = [];
        const hiddenHook = { original: true };
        Object.defineProperty(hiddenHook, 'toJSON', {
          value: () => ({ transformed: true }),
        });

        try {
          await kv.set('own-hook', hiddenHook);
          results.push('accepted');
        } catch (error) {
          results.push(error.message);
        }

        Object.defineProperty(Object.prototype, 'toJSON', {
          configurable: true,
          value: () => ({ transformed: true }),
        });
        try {
          await kv.set('inherited-hook', { original: true });
          results.push('accepted');
        } catch (error) {
          results.push(error.message);
        } finally {
          delete Object.prototype.toJSON;
        }

        return results;
      }
    `);

    expect(execution.error).toBeUndefined();
    expect(execution.responsePayload).toEqual([
      'WORKER_KV_INVALID_VALUE',
      'WORKER_KV_INVALID_VALUE',
    ]);
  });

  it('counts rejected private and workspace values against one call budget', async () => {
    const execution = await executeKVWorker(`
      async function fetch() {
        const errors = [];
        for (let index = 0; index < 51; index += 1) {
          const scope = index % 2 === 0 ? kv : kv.workspace;
          try {
            await scope.set('invalid-' + index, { fn: () => index });
            errors.push('accepted');
          } catch (error) {
            errors.push(String(error && error.message ? error.message : error));
          }
        }
        return errors;
      }
    `);

    expect(execution.error).toBeUndefined();
    expect(execution.responsePayload).toEqual([
      ...Array(50).fill('WORKER_KV_INVALID_VALUE'),
      'WORKER_KV_LIMIT_EXCEEDED',
    ]);
  });

  it('returns stable WorkerKVError fields without host or clone details', async () => {
    const execution = await executeKVWorker(`
      async function fetch() {
        try {
          await kv.set('invalid', { fn: () => true });
          return { accepted: true };
        } catch (error) {
          return {
            name: error.name,
            code: error.code,
            message: error.message,
            stack: String(error.stack),
          };
        }
      }
    `);

    expect(execution.error).toBeUndefined();
    expect(execution.responsePayload).toEqual(
      expect.objectContaining({
        name: 'WorkerKVError',
        code: 'WORKER_KV_INVALID_VALUE',
        message: 'WORKER_KV_INVALID_VALUE',
      })
    );
    expect((execution.responsePayload as any).stack).not.toContain(
      'could not be cloned'
    );
    expect((execution.responsePayload as any).stack).not.toContain(
      '/src/server/'
    );
  });

  it('hides bridge globals and inherited methods from public KV scopes', async () => {
    const execution = await executeKVWorker(`
      async function fetch() {
        return {
          privateConstructor: typeof kv.constructor,
          privateToString: typeof kv.toString,
          workspaceConstructor: typeof kv.workspace.constructor,
          workspaceToString: typeof kv.workspace.toString,
          rawPrivate: typeof globalThis.__workerKV,
          rawWorkspace: typeof globalThis.__workspaceKV,
          lexicalPrivate: typeof __workerKVScope,
          lexicalWorkspace: typeof __workspaceKVScope,
          privateKeys: Object.keys(kv).sort(),
          workspaceKeys: Object.keys(kv.workspace).sort(),
        };
      }
    `);

    expect(execution.error).toBeUndefined();
    expect(execution.responsePayload).toEqual({
      privateConstructor: 'undefined',
      privateToString: 'undefined',
      workspaceConstructor: 'undefined',
      workspaceToString: 'undefined',
      rawPrivate: 'undefined',
      rawWorkspace: 'undefined',
      lexicalPrivate: 'undefined',
      lexicalWorkspace: 'undefined',
      privateKeys: ['delete', 'get', 'set', 'workspace'],
      workspaceKeys: ['delete', 'get', 'set'],
    });
  });

  it('does not let hoisted worker declarations intercept bridge installation', async () => {
    const execution = await executeKVWorker(`
      const leaked = [];

      function reproxy(reference) {
        leaked.push(reference);
        return new Proxy(reference, {
          get(target, property, receiver) {
            if (target !== reference || property === 'then') {
              return Reflect.get(target, property, receiver);
            }

            const data = reference.get(property);
            if (
              typeof data === 'object' &&
              data instanceof _ivm.Reference &&
              data.typeof === 'function'
            ) {
              return (...args) => data.apply(undefined, args, {
                arguments: { copy: true },
                result: { promise: true },
              });
            }

            return data;
          },
        });
      }

      async function fetch() {
        return {
          leakedCount: leaked.length,
          rawPrivate: typeof globalThis.__workerKV,
          missing: (await kv.get('missing')) === undefined,
        };
      }
    `);

    expect(execution.error).toBeUndefined();
    expect(execution.responsePayload).toEqual({
      leakedCount: 0,
      rawPrivate: 'undefined',
      missing: true,
    });
  });

  it('installs KV before worker bindings shadow common globals', async () => {
    const execution = await executeKVWorker(`
      const globalThis = { worker: true };
      const Object = { worker: true };
      const Array = { worker: true };
      const Number = { worker: true };
      const JSON = { worker: true };
      const WeakSet = { worker: true };
      const Function = { worker: true };

      async function fetch() {
        await kv.set('shadowed', { accepted: true });
        return {
          value: await kv.get('shadowed'),
          workerBindings: [
            globalThis.worker,
            Object.worker,
            Array.worker,
            Number.worker,
            JSON.worker,
            WeakSet.worker,
            Function.worker,
          ],
        };
      }
    `);

    expect(execution.error).toBeUndefined();
    expect(execution.responsePayload).toEqual({
      value: { accepted: true },
      workerBindings: Array(7).fill(true),
    });
  });

  it('uses captured intrinsics after worker code patches global behavior', async () => {
    const execution = await executeKVWorker(`
      async function fetch() {
        const originalIterator = Array.prototype[Symbol.iterator];
        const OriginalError = globalThis.Error;
        const OriginalString = globalThis.String;

        Array.prototype[Symbol.iterator] = function* () {
          yield 'poison';
        };
        globalThis.Error = function InjectedError() {
          return { name: 'InjectedError', message: 'injected' };
        };
        globalThis.String = () => 'injected';

        try {
          await kv.set('stable-key', { accepted: true });
          let invalid;
          try {
            await kv.set('invalid', { fn: () => true });
          } catch (error) {
            invalid = {
              name: error.name,
              code: error.code,
              message: error.message,
            };
          }

          return {
            stored: await kv.get('stable-key'),
            invalid,
          };
        } finally {
          Array.prototype[Symbol.iterator] = originalIterator;
          globalThis.Error = OriginalError;
          globalThis.String = OriginalString;
        }
      }
    `);

    expect(execution.error).toBeUndefined();
    expect(execution.responsePayload).toEqual({
      stored: { accepted: true },
      invalid: {
        name: 'WorkerKVError',
        code: 'WORKER_KV_INVALID_VALUE',
        message: 'WORKER_KV_INVALID_VALUE',
      },
    });
  });
});
