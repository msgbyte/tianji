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
    prisma: {
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
  prisma: mocks.prisma,
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
});

afterEach(() => {
  vi.resetModules();
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
