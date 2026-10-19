import { afterEach, expect, test, vi } from 'vitest';

vi.mock('@/utils/env', () => ({ isDev: true }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('does not log the connection-test API key when the request fails', async () => {
  const apiKey = 'sk-sensitive-logger';
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('network failed');
    })
  );
  const { trpcClient } = await import('@/api/trpc');

  await expect(
    trpcClient.aiGateway.testConnection.mutate({
      workspaceId: 'tz4a98xxat96iws9zmbrgj3a',
      gatewayId: 'gateway_1',
      modelApiKey: apiKey,
      customModelBaseUrl: null,
      customModelName: null,
    })
  ).rejects.toThrow();

  expect(JSON.stringify([logSpy.mock.calls, errorSpy.mock.calls])).not.toContain(
    apiKey
  );
});
