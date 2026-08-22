import ivm from 'isolated-vm';
import { env } from '../env.js';
import { buildSandbox, environmentScript } from './sandbox.js';
import { transformTypescriptCode } from './utils.js';
import type { IVMExecutionResult } from './index.js';

export interface WorkerModuleArtifact {
  importAlias: string;
  compiledCode: string;
}

export interface RunWorkerModuleOptions {
  modules: WorkerModuleArtifact[];
  globals?: Record<string, any>;
  requestPayload: Record<string, any>;
  context: Record<string, any>;
}

const MAX_WORKER_SHARED_MODULES = 16;
const MAX_WORKER_MODULE_GRAPH_BYTES = 1024 * 1024;

/**
 * Execute a native ESM worker and its explicitly pinned shared modules in one
 * isolate. The linker intentionally has no fallback to Node, npm, URLs, or the
 * filesystem.
 */
export async function runWorkerModuleInIVM(
  workerSource: string,
  options: RunWorkerModuleOptions
): Promise<IVMExecutionResult> {
  if (options.modules.length > MAX_WORKER_SHARED_MODULES) {
    throw new Error(
      `A worker can load at most ${MAX_WORKER_SHARED_MODULES} shared modules`
    );
  }
  const graphSize = options.modules.reduce(
    (total, module) => total + Buffer.byteLength(module.compiledCode, 'utf8'),
    Buffer.byteLength(workerSource, 'utf8')
  );
  if (graphSize > MAX_WORKER_MODULE_GRAPH_BYTES) {
    throw new Error('Worker module graph exceeds the 1 MB limit');
  }

  const start = Date.now();
  const isolate = new ivm.Isolate({ memoryLimit: env.sandbox.memoryLimit });
  const logs: any[][] = [];
  const modules: ivm.Module[] = [];
  const references: ivm.Reference[] = [];
  let context: ivm.Context | undefined;
  let bootstrapScript: ivm.Script | undefined;
  let result: any;
  let error: any;

  try {
    context = await isolate.createContext();
    buildSandbox(context, {
      globals: options.globals,
      console: {
        log: (...args: any[]) => logs.push(['log', Date.now(), ...args]),
        warn: (...args: any[]) => logs.push(['warn', Date.now(), ...args]),
        error: (...args: any[]) => logs.push(['error', Date.now(), ...args]),
      },
    });

    bootstrapScript = await isolate.compileScript(
      `${environmentScript}\n${workerModuleRuntimePrelude}`
    );
    await bootstrapScript.run(context, { timeout: env.sandbox.timeout });

    try {
      const moduleByAlias = new Map<string, ivm.Module>();
      for (const artifact of options.modules) {
        if (moduleByAlias.has(artifact.importAlias)) {
          throw new Error(`Duplicate shared module binding: ${artifact.importAlias}`);
        }
        const module = await isolate.compileModule(artifact.compiledCode, {
          filename: artifact.importAlias,
        });
        if (module.dependencySpecifiers.length > 0) {
          throw new Error(
            `Shared module ${artifact.importAlias} cannot import dependencies`
          );
        }
        modules.push(module);
        moduleByAlias.set(artifact.importAlias, module);
      }

      const compiledWorkerSource = await transformTypescriptCode(workerSource);
      const workerModule = await isolate.compileModule(compiledWorkerSource, {
        filename: 'function-worker.ts',
      });
      modules.push(workerModule);

      const rejectModuleDependency = (specifier: string) => {
        throw new Error(
          `Shared modules cannot import dependencies: ${specifier}`
        );
      };
      for (const module of moduleByAlias.values()) {
        await module.instantiate(context, rejectModuleDependency);
      }
      await workerModule.instantiate(context, (specifier) => {
        const dependency = moduleByAlias.get(specifier);
        if (!dependency) {
          throw new Error(`Module import is not bound to this worker: ${specifier}`);
        }
        return dependency;
      });
      await workerModule.evaluate({ timeout: env.sandbox.timeout });

      const defaultExport = await workerModule.namespace.get('default', {
        reference: true,
      });
      if (defaultExport instanceof ivm.Reference) {
        references.push(defaultExport);
      }
      let handler: ivm.Reference | undefined;
      if (
        defaultExport instanceof ivm.Reference &&
        defaultExport.typeof === 'function'
      ) {
        handler = defaultExport;
      } else if (defaultExport instanceof ivm.Reference) {
        const fetchExport = await defaultExport.get('fetch', { reference: true });
        if (fetchExport instanceof ivm.Reference) {
          references.push(fetchExport);
          if (fetchExport.typeof === 'function') {
            handler = fetchExport;
          }
        }
      }
      if (!handler) {
        const namedFetch = await workerModule.namespace.get('fetch', {
          reference: true,
        });
        if (namedFetch instanceof ivm.Reference) {
          references.push(namedFetch);
          if (namedFetch.typeof === 'function') {
            handler = namedFetch;
          }
        }
      }

      result = handler
        ? await handler.apply(
            undefined,
            [options.requestPayload, options.context],
            {
              arguments: { copy: true },
              result: { promise: true, copy: true },
              timeout: env.sandbox.timeout,
            }
          )
        : 'fetch is not defined';
    } catch (executionError) {
      error = executionError;
    }

    return {
      logger: logs,
      result,
      error,
      usage: Date.now() - start,
      cpuTime: Number(isolate.cpuTime),
      memoryUsage: await isolate.getHeapStatistics(),
    };
  } finally {
    for (const reference of references.reverse()) {
      try {
        reference.release();
      } catch {}
    }
    for (const module of modules.reverse()) {
      try {
        module.release();
      } catch {}
    }
    try {
      bootstrapScript?.release();
    } catch {}
    try {
      context?.release();
    } catch {}
    isolate.dispose();
  }
}

const workerModuleRuntimePrelude = `
(() => {
  const privateBridge = reproxy(globalThis.__workerKV);
  const workspaceBridge = reproxy(globalThis.__workspaceKV);
  delete globalThis.__workerKV;
  delete globalThis.__workspaceKV;

  const sanitizeError = (error) => {
    const message = error && typeof error.message === 'string'
      ? error.message
      : String(error);
    const allowed = [
      'WORKER_KV_INVALID_KEY',
      'WORKER_KV_INVALID_VALUE',
      'WORKER_KV_INVALID_TTL',
      'WORKER_KV_LIMIT_EXCEEDED',
      'WORKER_KV_TIMEOUT',
      'WORKER_KV_UNAVAILABLE',
    ];
    return allowed.includes(message) || allowed.includes(message.replace(/^Error: /, ''))
      ? message.replace(/^Error: /, '')
      : 'WORKER_KV_UNAVAILABLE';
  };
  const invoke = async (method, args) => {
    try {
      return await Reflect.apply(method, undefined, args);
    } catch (error) {
      const code = sanitizeError(error);
      const sanitized = new Error(code);
      sanitized.name = 'WorkerKVError';
      sanitized.code = code;
      throw sanitized;
    }
  };
  const encodeKey = (key) => typeof key === 'string' ? key : '';
  const encodeValue = (value) => {
    try {
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  };
  const createScope = (bridge) => Object.freeze(Object.assign(Object.create(null), {
    get: (key) => invoke(bridge.get, [encodeKey(key)]),
    set: (key, value, ttl) => invoke(bridge.set, [
      encodeKey(key),
      encodeValue(value),
      ttl === undefined || typeof ttl === 'number' ? ttl : 0,
    ]),
    delete: (key) => invoke(bridge.delete, [encodeKey(key)]),
  }));
  const privateScope = createScope(privateBridge);
  globalThis.kv = Object.freeze(Object.assign(Object.create(null), {
    get: privateScope.get,
    set: privateScope.set,
    delete: privateScope.delete,
    workspace: createScope(workspaceBridge),
  }));
})();
`;
