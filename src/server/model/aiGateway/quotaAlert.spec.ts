import { expect, test, vi } from 'vitest';
import { checkQuotaAlert } from './quotaAlert.js';
import { prisma } from '../_client.js';

vi.mock('../_client.js', () => ({
  prisma: {
    aIGatewayQuotaAlert: {
      findFirst: vi.fn(async () => ({
        notificationId: 'notification',
        dailyQuota: 100,
      })),
    },
    aIGatewayLogs: { aggregate: vi.fn(async () => ({ _sum: { price: 1 } })) },
  },
}));
vi.mock('../../cache/index.js', () => ({
  buildQueryWithCache: (_name: string, get: unknown) => ({
    get,
    del: vi.fn(),
    update: vi.fn(),
  }),
  getCacheManager: async () => ({ get: vi.fn(), set: vi.fn() }),
}));
vi.mock('../../cache/distributedLock.js', () => ({
  withDistributedLock: vi.fn(),
}));
vi.mock('../notification/index.js', () => ({ sendNotification: vi.fn() }));
vi.mock('../workspace.js', () => ({ getWorkspaceSettings: vi.fn() }));

test('includes paid failed requests when rebuilding daily quota cost', async () => {
  await checkQuotaAlert('workspace', 'gateway', 1);
  expect(prisma.aIGatewayLogs.aggregate).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        workspaceId: 'workspace',
        gatewayId: 'gateway',
        status: { in: ['Success', 'Failed'] },
      }),
    })
  );
});
