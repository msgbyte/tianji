import { createId } from '@paralleldrive/cuid2';
import { AIRouterLogsStatus } from '@prisma/client';
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
    transaction: vi.fn(),
    prisma: {
      workspaceAuditLog: { create: vi.fn() },
      aIRouter: { findFirst: vi.fn() },
      aIRouterTier: { findMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
      aIRouterNode: { createMany: vi.fn() },
      aIRouterLogs: {
        findMany: vi.fn(),
      },
      aIGateway: {
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock('../../middleware/auth.js', () => ({
  jwtVerify: mocks.jwtVerify,
}));

vi.mock('../../model/auth.js', () => ({
  authConfig: {},
}));

vi.mock('../../model/user.js', () => ({
  verifyUserApiKey: vi.fn(),
}));

vi.mock('../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
}));

vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: {
    startTimer: mocks.promStartTimer,
  },
}));

vi.mock('../../model/_client.js', () => ({
  prisma: { ...mocks.prisma, $transaction: mocks.transaction },
}));

async function createCaller() {
  const { aiRouterRouter } = await import('./aiRouter.js');

  return aiRouterRouter.createCaller({
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
  mocks.transaction.mockImplementation((callback) => callback(mocks.prisma));
});

afterEach(() => {
  vi.resetModules();
});

test('omits gateway secrets from router options, nested info and saved tiers', async () => {
  const workspaceId = createId();
  const timestamps = { createdAt: new Date(), updatedAt: new Date() };
  const gateway = {
    ...timestamps,
    id: 'gateway_1',
    workspaceId,
    name: 'Gateway',
    modelApiKey: 'sk-private-upstream',
    customModelInputPrice: null,
    customModelOutputPrice: null,
    customModelStrategy: null,
  };
  const node = {
    ...timestamps,
    id: 'node_1',
    workspaceId,
    routerId: 'router_1',
    tierId: 'tier_1',
    gatewayId: gateway.id,
    provider: 'openai' as const,
    order: 0,
    enabled: true,
    weight: 100,
    timeoutMs: 30000,
    retryableStatusCodes: [],
    failOnEmptyContent: false,
    gateway,
  };
  const tier = {
    ...timestamps,
    id: 'tier_1',
    workspaceId,
    routerId: 'router_1',
    order: 0,
    nodes: [node],
  };
  const router = {
    ...timestamps,
    id: 'router_1',
    workspaceId,
    name: 'Router',
    enabled: true,
    tiers: [tier],
  };
  mocks.prisma.aIGateway.findMany.mockResolvedValue([gateway]);
  mocks.prisma.aIRouter.findFirst.mockResolvedValue(router);
  mocks.prisma.aIRouterTier.findMany.mockResolvedValue([tier]);
  mocks.prisma.aIRouterTier.create.mockResolvedValue(tier);
  mocks.getWorkspaceUser.mockResolvedValue({ role: 'readOnly' });
  const caller = await createCaller();
  const options = await caller.compatibleGateways({ workspaceId });
  const info = await caller.info({ workspaceId, routerId: router.id });
  mocks.getWorkspaceUser.mockResolvedValue({ role: 'write' });
  const tiers = await caller.replaceTiers({
    workspaceId,
    routerId: router.id,
    tiers: [{ order: 0, nodes: [node] }],
  });
  for (const result of [options, info, tiers]) {
    expect(JSON.stringify(result)).not.toContain(gateway.modelApiKey);
    expect(JSON.stringify(result)).not.toContain('"modelApiKey"');
  }
  for (const result of [
    options[0],
    info?.tiers[0].nodes[0].gateway,
    tiers[0].nodes[0].gateway,
  ]) {
    expect(result).toMatchObject({ id: gateway.id, hasModelApiKey: true });
  }
});

describe('aiRouterRouter.logs', () => {
  test('does not query gateways while listing router logs', async () => {
    const workspaceId = createId();
    const createdAt = new Date('2026-06-28T00:00:00.000Z');

    mocks.prisma.aIRouterLogs.findMany.mockResolvedValue([
      {
        id: 'router_log_1',
        workspaceId,
        routerId: 'router_1',
        protocol: 'openai-chat',
        status: AIRouterLogsStatus.Success,
        finalGatewayId: 'gateway_1',
        finalGatewayLogId: 'gateway_log_1',
        attemptGatewayIds: ['gateway_1'],
        attemptGatewayLogIds: ['gateway_log_1'],
        attemptErrors: null,
        attemptCount: 1,
        duration: 123,
        createdAt,
      },
    ]);

    const caller = await createCaller();

    const result = await caller.logs({
      workspaceId,
      routerId: 'router_1',
      limit: 20,
    });

    expect(mocks.prisma.aIGateway.findMany).not.toHaveBeenCalled();
    expect(result.items[0]).toMatchObject({
      finalGatewayId: 'gateway_1',
      finalGatewayLogId: 'gateway_log_1',
    });
    expect('finalGateway' in result.items[0]).toBe(false);
  });
});
