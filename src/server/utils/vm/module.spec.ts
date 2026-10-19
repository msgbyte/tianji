import { describe, expect, test } from 'vitest';
import { createSandboxProxy } from './sandbox.js';
import { runWorkerModuleInIVM } from './module.js';

function createGlobals() {
  const bridge = createSandboxProxy({
    get: async () => undefined,
    set: async () => true,
    delete: async () => true,
  });
  return { __workerKV: bridge, __workspaceKV: bridge };
}

describe('runWorkerModuleInIVM', () => {
  test('links an explicitly bound shared module and invokes default.fetch', async () => {
    const execution = await runWorkerModuleInIVM(
      `
        import { add } from '@shared/math';
        export default {
          fetch(payload: { left: number; right: number }) {
            console.log('adding');
            return { total: add(payload.left, payload.right) };
          }
        };
      `,
      {
        modules: [
          {
            importAlias: '@shared/math',
            compiledCode: 'export const add = (left, right) => left + right;',
          },
        ],
        globals: createGlobals(),
        requestPayload: { left: 2, right: 3 },
        context: { type: 'test' },
      }
    );

    expect(execution.error).toBeUndefined();
    expect(execution.result).toEqual({ total: 5 });
    expect(execution.logger[0]?.[0]).toBe('log');
  });

  test('logs imported module functions without trying to clone them', async () => {
    const execution = await runWorkerModuleInIVM(
      `
        import { sendAlert } from '@shared/alert';
        export default {
          async fetch(payload: { title: string; message: string }, context: object) {
            console.log('ctx', context, sendAlert);
            return await sendAlert(payload);
          }
        };
      `,
      {
        modules: [
          {
            importAlias: '@shared/alert',
            compiledCode: `
              function formatAlert(alert) {
                return '[' + alert.title + '] ' + alert.message;
              }
              async function sendAlert(alert) {
                const text = formatAlert(alert);
                return { sent: text.length > 0 };
              }
              export { formatAlert, sendAlert };
            `,
          },
        ],
        globals: createGlobals(),
        requestPayload: { title: 'Test', message: 'hello' },
        context: { type: 'test' },
      }
    );

    expect(execution.error).toBeUndefined();
    expect(execution.result).toEqual({ sent: true });
    expect(execution.logger).toEqual([
      ['log', expect.any(Number), 'ctx', { type: 'test' }, '[AsyncFunction: sendAlert]'],
    ]);
  });

  test('rejects imports which are not pinned to the worker', async () => {
    const execution = await runWorkerModuleInIVM(
      `
        import { add } from '@shared/missing';
        export default () => add(1, 2);
      `,
      {
        modules: [],
        globals: createGlobals(),
        requestPayload: {},
        context: { type: 'test' },
      }
    );

    expect(String(execution.error)).toContain(
      'Module import is not bound to this worker'
    );
  });

  test('rejects module graphs over the count limit before creating an isolate', async () => {
    await expect(
      runWorkerModuleInIVM('export default () => true', {
        modules: Array.from({ length: 17 }, (_, index) => ({
          importAlias: `@shared/module-${index}`,
          compiledCode: 'export const value = true;',
        })),
        globals: createGlobals(),
        requestPayload: {},
        context: { type: 'test' },
      })
    ).rejects.toThrow('at most 16 shared modules');
  });

  test('rejects module graphs over the compiled size limit', async () => {
    await expect(
      runWorkerModuleInIVM('export default () => true', {
        modules: [
          {
            importAlias: '@shared/large',
            compiledCode: `export const value = '${'x'.repeat(1024 * 1024)}';`,
          },
        ],
        globals: createGlobals(),
        requestPayload: {},
        context: { type: 'test' },
      })
    ).rejects.toThrow('exceeds the 1 MB limit');
  });
});
