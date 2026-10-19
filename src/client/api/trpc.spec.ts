import { afterEach, describe, expect, test, vi } from 'vitest';
import { trpcClient } from './trpc';

vi.mock('../utils/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/env')>()),
  isDev: true,
}));

describe('tRPC client logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test.each([
    {
      path: 'worker.upsert',
      secret: 'upsert-secret-value',
      execute: () =>
        trpcClient.worker.upsert.mutate({
          workspaceId: 'workspace-a',
          name: 'Worker',
          code: 'async function fetch() {}',
          active: true,
          enableCron: false,
          environmentVariables: [
            {
              key: 'TOKEN',
              type: 'Secret',
              value: 'upsert-secret-value',
            },
          ],
        }),
    },
    {
      path: 'worker.testCode',
      secret: 'test-code-secret-value',
      execute: () =>
        trpcClient.worker.testCode.mutate({
          workspaceId: 'workspace-a',
          code: 'async function fetch() {}',
          environmentVariables: [
            {
              key: 'TOKEN',
              type: 'Secret',
              value: 'test-code-secret-value',
            },
          ],
        }),
    },
  ])('does not log $path inputs after a failed request', async ({
    execute,
    secret,
  }) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('simulated network failure'))
    );
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const consoleLog = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    await expect(execute()).rejects.toThrow('simulated network failure');

    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(
      JSON.stringify([consoleLog.mock.calls, consoleError.mock.calls])
    ).not.toContain(secret);
  });
});
