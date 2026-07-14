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
    aIGateway: { findFirst: mocks.findGateway },
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
