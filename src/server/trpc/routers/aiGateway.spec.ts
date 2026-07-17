import { createId } from '@paralleldrive/cuid2';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const endRequest = vi.fn();

  return {
    endRequest,
    jwtVerify: vi.fn(() => ({
      id: 'user-id',
      username: 'user',
      role: 'user',
    })),
    getWorkspaceUser: vi.fn(async () => ({ role: 'owner' })),
    promStartTimer: vi.fn(() => endRequest),
    findGateway: vi.fn(),
    createGateway: vi.fn(),
    testConnection: vi.fn(),
  };
});

vi.mock('../../middleware/auth.js', () => ({
  jwtVerify: mocks.jwtVerify,
}));

vi.mock('../../model/auth.js', () => ({ authConfig: {} }));

vi.mock('../../model/user.js', () => ({
  verifyUserApiKey: vi.fn(),
}));

vi.mock('../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
}));

vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: mocks.promStartTimer },
}));

vi.mock('../../model/_client.js', () => ({
  prisma: {
    aIGateway: {
      findFirst: mocks.findGateway,
      create: mocks.createGateway,
    },
  },
}));

vi.mock('../../model/aiGateway.js', () => ({
  clearGatewayInfoCache: vi.fn(),
}));

vi.mock('../../model/aiGateway/quotaAlert.js', () => ({
  clearQuotaAlertCacheForGateway: vi.fn(),
}));

vi.mock('../../model/aiGateway/connectivity.js', () => ({
  testAIGatewayCustomConnection: mocks.testConnection,
}));

async function createCaller() {
  const { aiGatewayRouter } = await import('./aiGateway.js');

  return aiGatewayRouter.createCaller({
    token: 'jwt-token',
    timezone: 'utc',
    language: 'en',
    req: {} as any,
    origin: '',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getWorkspaceUser.mockResolvedValue({ role: 'owner' });
});

afterEach(() => {
  vi.resetModules();
});

describe('aiGatewayRouter.testConnection', () => {
  test('rejects a gateway outside the current workspace', async () => {
    const workspaceId = createId();
    mocks.findGateway.mockResolvedValue(null);
    const caller = await createCaller();

    await expect(
      caller.testConnection({
        workspaceId,
        gatewayId: 'gateway_1',
        modelApiKey: 'sk-current',
        customModelBaseUrl: 'https://models.example.com/v1',
        customModelName: null,
      })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'AI Gateway not found',
    });

    expect(mocks.findGateway).toHaveBeenCalledWith({
      where: { id: 'gateway_1', workspaceId },
      select: { id: true },
    });
    expect(mocks.testConnection).not.toHaveBeenCalled();
  });

  test('returns only the selected model and duration', async () => {
    const workspaceId = createId();
    mocks.findGateway.mockResolvedValue({ id: 'gateway_1' });
    mocks.testConnection.mockResolvedValue({
      model: 'selected-model',
      durationMs: 42,
    });
    const caller = await createCaller();

    const result = await caller.testConnection({
      workspaceId,
      gatewayId: 'gateway_1',
      modelApiKey: 'sk-current',
      customModelBaseUrl: 'https://models.example.com/v1',
      customModelName: 'selected-model',
    });

    expect(mocks.testConnection).toHaveBeenCalledWith({
      modelApiKey: 'sk-current',
      customModelBaseUrl: 'https://models.example.com/v1',
      customModelName: 'selected-model',
    });
    expect(result).toEqual({ model: 'selected-model', durationMs: 42 });
    expect(JSON.stringify(result)).not.toContain('sk-current');
  });

  test('redacts the submitted API key from a successful service result', async () => {
    const workspaceId = createId();
    const apiKey = 'sk-sensitive';
    mocks.findGateway.mockResolvedValue({ id: 'gateway_1' });
    mocks.testConnection.mockResolvedValue({
      model: `provider/${apiKey}/model`,
      durationMs: 42,
    });
    const caller = await createCaller();

    const result = await caller.testConnection({
      workspaceId,
      gatewayId: 'gateway_1',
      modelApiKey: apiKey,
      customModelBaseUrl: null,
      customModelName: null,
    });

    expect(result).toEqual({
      model: 'provider/[REDACTED]/model',
      durationMs: 42,
    });
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });

  test('maps upstream failures to a BAD_GATEWAY error', async () => {
    const workspaceId = createId();
    mocks.findGateway.mockResolvedValue({ id: 'gateway_1' });
    mocks.testConnection.mockRejectedValue(new Error('Authentication failed'));
    const caller = await createCaller();

    await expect(
      caller.testConnection({
        workspaceId,
        gatewayId: 'gateway_1',
        modelApiKey: 'sk-current',
        customModelBaseUrl: null,
        customModelName: 'selected-model',
      })
    ).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'Authentication failed',
    });
  });
});

describe('aiGatewayRouter.duplicate', () => {
  test('rejects a gateway outside the current workspace', async () => {
    const workspaceId = createId();
    mocks.findGateway.mockResolvedValue(null);
    const caller = await createCaller();

    await expect(
      caller.duplicate({
        workspaceId,
        gatewayId: 'gateway_1',
        name: 'Gateway Copy',
      })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'AI Gateway not found',
    });

    expect(mocks.findGateway).toHaveBeenCalledWith({
      where: { id: 'gateway_1', workspaceId },
      select: {
        modelApiKey: true,
        customModelBaseUrl: true,
        customModelName: true,
        customModelStrategy: true,
        customModelInputPrice: true,
        customModelOutputPrice: true,
      },
    });
    expect(mocks.createGateway).not.toHaveBeenCalled();
  });

  test('copies gateway configuration server-side and returns no secret', async () => {
    const workspaceId = createId();
    const apiKey = 'sk-sensitive-duplicate';
    mocks.findGateway.mockResolvedValue({
      modelApiKey: apiKey,
      customModelBaseUrl: 'https://models.example.com/v1',
      customModelName: 'model-a',
      customModelStrategy: { price: { input: 1 } },
      customModelInputPrice: 2,
      customModelOutputPrice: 3,
    });
    mocks.createGateway.mockResolvedValue({
      id: 'gateway_copy',
      name: 'Gateway Copy',
    });
    const caller = await createCaller();

    const result = await caller.duplicate({
      workspaceId,
      gatewayId: 'gateway_1',
      name: '  Gateway Copy  ',
    });

    expect(mocks.createGateway).toHaveBeenCalledWith({
      data: {
        workspaceId,
        name: 'Gateway Copy',
        modelApiKey: apiKey,
        customModelBaseUrl: 'https://models.example.com/v1',
        customModelName: 'model-a',
        customModelStrategy: { price: { input: 1 } },
        customModelInputPrice: 2,
        customModelOutputPrice: 3,
      },
      select: { id: true, name: true },
    });
    expect(result).toEqual({ id: 'gateway_copy', name: 'Gateway Copy' });
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });

  test.each([
    ['empty', ''],
    ['whitespace-only', '   '],
    ['overlength', 'a'.repeat(101)],
  ])('rejects a %s gateway name', async (_label, name) => {
    const caller = await createCaller();

    await expect(
      caller.duplicate({
        workspaceId: createId(),
        gatewayId: 'gateway_1',
        name,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    expect(mocks.findGateway).not.toHaveBeenCalled();
    expect(mocks.createGateway).not.toHaveBeenCalled();
  });
});
