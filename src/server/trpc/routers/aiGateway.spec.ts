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
    findLogs: vi.fn(),
    findLog: vi.fn(),
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
    workspaceAuditLog: {
      create: vi.fn(),
    },
    aIGateway: {
      findFirst: mocks.findGateway,
      create: mocks.createGateway,
    },
    aIGatewayLogs: {
      findMany: mocks.findLogs,
      findFirst: mocks.findLog,
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

vi.mock('../../utils/model_prices_and_context_window_v2.json', () => ({
  default: {
    alpha: {
      name: 'Alpha',
      models: { 'shared-model': { name: 'Shared Model' } },
    },
    beta: {
      name: 'Beta',
      models: {
        'shared-model': { name: 'Shared Model' },
        'beta-special': { name: 'Reasoning Model' },
      },
    },
  },
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

describe('aiGatewayRouter.modelPricing', () => {
  test('returns all provider options independently of search and limit', async () => {
    const caller = await createCaller();
    const workspaceId = createId();

    for (const search of [undefined, 'no-match']) {
      const result = await caller.modelPricing({
        workspaceId,
        search,
        limit: 1,
      });

      expect(result).toMatchObject({
        availableProviders: [
          { id: 'alpha', name: 'Alpha' },
          { id: 'beta', name: 'Beta' },
        ],
      });
      expect(result.providers.map(({ id }) => id)).toEqual(
        search ? [] : ['alpha']
      );
    }
  });

  test('filters by exact provider before limiting and combines model search', async () => {
    const caller = await createCaller();
    const workspaceId = createId();

    for (const [search, modelId] of [
      [undefined, 'shared-model'],
      ['BETA-SPECIAL', 'beta-special'],
      ['reasoning', 'beta-special'],
    ]) {
      const result = await caller.modelPricing({
        workspaceId,
        providerId: 'beta',
        search,
        limit: 1,
      });

      expect(result.providers).toEqual([
        expect.objectContaining({
          id: 'beta',
          models: [expect.objectContaining({ id: modelId })],
        }),
      ]);
    }

    for (const providerId of ['bet', 'missing']) {
      const result = await caller.modelPricing({ workspaceId, providerId });
      expect(result.providers).toEqual([]);
    }
  });
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

describe('aiGatewayRouter.logs', () => {
  test('returns summary fields without reading or returning payloads', async () => {
    const workspaceId = createId();
    const log = createLog('log_1', new Date());
    log.requestPayload = { messages: ['Large request'.repeat(1000)] };
    log.responsePayload = { content: 'Large response'.repeat(1000) };
    mocks.findLogs.mockResolvedValueOnce([log]);
    const caller = await createCaller();

    const result = await caller.logs({ workspaceId, gatewayId: 'gateway_1' });

    expect(result.items).toEqual([
      expect.objectContaining({ id: log.id, price: 0 }),
    ]);
    expect(result.items[0]).not.toHaveProperty('requestPayload');
    expect(result.items[0]).not.toHaveProperty('responsePayload');
    expect(mocks.findLogs.mock.calls[0][0].select).toEqual(summarySelect);
  });

  test('accepts an openedAt date serialized by an HTTP client', async () => {
    const workspaceId = createId();
    const serializedOpenedAt = '2026-09-03T08:00:00.000Z';
    mocks.findLogs.mockResolvedValue([]);
    const caller = await createCaller();

    await caller.logs({
      workspaceId,
      gatewayId: 'gateway_1',
      openedAt: serializedOpenedAt as unknown as Date,
      limit: 100,
    });

    expect(mocks.findLogs).toHaveBeenCalledWith({
      where: {
        workspaceId,
        gatewayId: 'gateway_1',
        createdAt: { gte: new Date(serializedOpenedAt) },
      },
      take: 101,
      select: summarySelect,
      cursor: undefined,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  });

  test('filters from open time, paginates chronologically, and refreshes pending rows', async () => {
    const workspaceId = createId();
    const openedAt = new Date('2026-09-03T08:00:00Z');
    const freshLogs = Array.from({ length: 101 }, (_, index) =>
      createLog(`log_${index}`, new Date(openedAt.getTime() + index))
    );
    const completedPendingLog = createLog(
      'pending_1',
      new Date(openedAt.getTime() + 1),
      'Success'
    );
    mocks.findLogs
      .mockResolvedValueOnce(freshLogs)
      .mockResolvedValueOnce([completedPendingLog]);
    const caller = await createCaller();

    const result = await caller.logs({
      workspaceId,
      gatewayId: 'gateway_1',
      openedAt,
      pendingIds: ['pending_1'],
      limit: 100,
    });

    expect(mocks.findLogs).toHaveBeenNthCalledWith(1, {
      where: {
        workspaceId,
        gatewayId: 'gateway_1',
        createdAt: { gte: openedAt },
      },
      take: 101,
      select: summarySelect,
      cursor: undefined,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    expect(mocks.findLogs).toHaveBeenNthCalledWith(2, {
      where: {
        workspaceId,
        gatewayId: 'gateway_1',
        createdAt: { gte: openedAt },
        id: { in: ['pending_1'] },
      },
      select: summarySelect,
    });
    expect(result.nextCursor).toBe('log_100');
    const { requestPayload, responsePayload, ...summary } = completedPendingLog;
    expect(result.items).toContainEqual(summary);
    for (const item of result.items) {
      expect(item).not.toHaveProperty('requestPayload');
      expect(item).not.toHaveProperty('responsePayload');
    }
  });
});

describe('aiGatewayRouter.logDetail', () => {
  test('loads payloads only for a log in the requested workspace and gateway', async () => {
    const workspaceId = createId();
    const log = createLog('log_1', new Date(), 'Success');
    log.requestPayload = { messages: [{ role: 'user', content: 'Hola' }] };
    log.responsePayload = { content: 'Respuesta' };
    mocks.findLog.mockResolvedValueOnce(log);
    const caller = await createCaller();

    const result = await caller.logDetail({
      workspaceId,
      gatewayId: 'gateway_1',
      logId: log.id,
    });

    expect(mocks.findLog).toHaveBeenCalledWith({
      where: { workspaceId, gatewayId: 'gateway_1', id: log.id },
    });
    expect(result).toEqual(log);
  });

  test('does not return a log outside the requested workspace or gateway', async () => {
    mocks.findLog.mockResolvedValueOnce(null);
    const caller = await createCaller();

    await expect(
      caller.logDetail({
        workspaceId: createId(),
        gatewayId: 'gateway_1',
        logId: 'missing',
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

const summarySelect = {
  id: true,
  workspaceId: true,
  gatewayId: true,
  inputToken: true,
  outputToken: true,
  cacheReadInputToken: true,
  cacheWriteInputToken: true,
  stream: true,
  modelName: true,
  modelProvider: true,
  status: true,
  duration: true,
  ttft: true,
  tpot: true,
  price: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
};

function createLog(id: string, createdAt: Date, status = 'Pending') {
  return {
    id,
    workspaceId: 'workspace_1',
    gatewayId: 'gateway_1',
    inputToken: 0,
    outputToken: 0,
    cacheReadInputToken: 0,
    cacheWriteInputToken: 0,
    stream: true,
    modelName: 'gpt-5',
    modelProvider: 'openai',
    status,
    duration: 0,
    ttft: -1,
    tpot: -1,
    price: 0,
    requestPayload: {},
    responsePayload: {},
    userId: null,
    createdAt,
    updatedAt: createdAt,
  };
}
