import { describe, expect, test, vi } from 'vitest';
import {
  AIGatewayConnectivityClient,
  testAIGatewayCustomConnection,
} from './connectivity.js';

function createFakeClient(modelIds: string[] = []) {
  const list = vi.fn(async () => ({
    data: modelIds.map((id) => ({ id })),
  }));
  const create = vi.fn(async () => ({ id: 'completion_1' }));
  const client: AIGatewayConnectivityClient = {
    models: { list },
    chat: { completions: { create } },
  };

  return { client, list, create };
}

describe('testAIGatewayCustomConnection', () => {
  test('rejects a blank API key before creating the client', async () => {
    const { client, list, create } = createFakeClient();
    const createClient = vi.fn(() => client);

    await expect(
      testAIGatewayCustomConnection(
        {
          modelApiKey: '   ',
          customModelBaseUrl: null,
          customModelName: 'configured-model',
        },
        { createClient }
      )
    ).rejects.toThrow('API key is required');

    expect(createClient).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  test('uses the configured model without requesting the model list', async () => {
    const { client, list, create } = createFakeClient();
    const createClient = vi.fn(() => client);
    const now = vi.fn().mockReturnValueOnce(1_000).mockReturnValueOnce(1_035);

    const result = await testAIGatewayCustomConnection(
      {
        modelApiKey: 'sk-current',
        customModelBaseUrl: 'https://models.example.com/v1',
        customModelName: '  configured-model  ',
      },
      { createClient, now }
    );

    expect(createClient).toHaveBeenCalledWith({
      apiKey: 'sk-current',
      baseURL: 'https://models.example.com/v1',
      maxRetries: 0,
      timeout: 15_000,
    });
    expect(list).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      model: 'configured-model',
      messages: [{ role: 'user', content: 'Reply with OK.' }],
      max_tokens: 1,
      stream: false,
    });
    expect(result).toEqual({ model: 'configured-model', durationMs: 35 });
  });

  test('uses the first listed model when the configured model is empty', async () => {
    const { client, list, create } = createFakeClient([
      'first-model',
      'second-model',
    ]);

    const result = await testAIGatewayCustomConnection(
      {
        modelApiKey: 'sk-current',
        customModelBaseUrl: null,
        customModelName: '   ',
      },
      {
        createClient: () => client,
        now: vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(28),
      }
    );

    expect(list).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'first-model' })
    );
    expect(result).toEqual({ model: 'first-model', durationMs: 18 });
  });

  test('fails explicitly when the upstream model list is empty', async () => {
    const { client, create } = createFakeClient();

    await expect(
      testAIGatewayCustomConnection(
        {
          modelApiKey: 'sk-current',
          customModelBaseUrl: null,
          customModelName: null,
        },
        { createClient: () => client }
      )
    ).rejects.toThrow('No models available from upstream');

    expect(create).not.toHaveBeenCalled();
  });

  test('redacts the API key from upstream errors', async () => {
    const { client, create } = createFakeClient();
    create.mockRejectedValueOnce(
      new Error('Authentication rejected credential sk-sensitive')
    );

    await expect(
      testAIGatewayCustomConnection(
        {
          modelApiKey: 'sk-sensitive',
          customModelBaseUrl: null,
          customModelName: 'configured-model',
        },
        { createClient: () => client }
      )
    ).rejects.toThrow('Authentication rejected credential [REDACTED]');
  });
});
