import { beforeEach, describe, expect, test, vi } from 'vitest';
import { prisma } from '../_client.js';
import { resolveAIGatewayModelApiKey } from '../aiGateway.js';
import { verifyUserApiKey } from '../user.js';

vi.mock('../_client.js', () => ({
  prisma: {
    aIGateway: { findUnique: vi.fn() },
    userApiKey: { findUnique: vi.fn(), update: vi.fn() },
    workspacesOnUsers: { findFirst: vi.fn() },
  },
}));
vi.mock('../../cache/index.js', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  buildQueryWithCache: (_name: string, get: unknown) => ({ get, del: vi.fn() }),
}));

const args = {
  workspaceId: 'workspace',
  gatewayId: 'gateway',
  requestApiKey: 'caller-secret-key',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.aIGateway.findUnique).mockResolvedValue({
    id: args.gatewayId,
    workspaceId: args.workspaceId,
    modelApiKey: 'upstream-key',
  } as any);
  vi.mocked(prisma.userApiKey.findUnique).mockResolvedValue({
    user: { id: 'user' },
  } as any);
  vi.mocked(prisma.userApiKey.update).mockResolvedValue({} as any);
  vi.mocked(prisma.workspacesOnUsers.findFirst).mockResolvedValue({
    userId: 'user',
  } as any);
});

describe('gateway credentials', () => {
  test('requires workspace membership before releasing a stored upstream key', async () => {
    vi.mocked(prisma.workspacesOnUsers.findFirst).mockResolvedValue(null);
    await expect(resolveAIGatewayModelApiKey(args)).rejects.toMatchObject({
      status: 403,
    });
  });
  test.each([null, { id: 'gateway', workspaceId: 'other' }])(
    'rejects missing or mismatched gateways',
    async (gateway) => {
      vi.mocked(prisma.aIGateway.findUnique).mockResolvedValue(gateway as any);
      await expect(resolveAIGatewayModelApiKey(args)).rejects.toMatchObject({
        status: 404,
      });
    }
  );
  test('requires a credential even for BYOK', async () => {
    await expect(
      resolveAIGatewayModelApiKey({ ...args, requestApiKey: '' })
    ).rejects.toMatchObject({ status: 401 });
  });
  test('uses the stored key only for a verified workspace member', async () => {
    await expect(resolveAIGatewayModelApiKey(args)).resolves.toMatchObject({
      modelApiKey: 'upstream-key',
      userId: 'user',
    });
    expect(prisma.workspacesOnUsers.findFirst).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace', userId: 'user' },
    });
  });
  test('preserves BYOK without requiring a Tianji account', async () => {
    vi.mocked(prisma.aIGateway.findUnique).mockResolvedValue({
      id: 'gateway',
      workspaceId: 'workspace',
    } as any);
    await expect(resolveAIGatewayModelApiKey(args)).resolves.toMatchObject({
      modelApiKey: args.requestApiKey,
      userId: null,
    });
    expect(prisma.userApiKey.findUnique).not.toHaveBeenCalled();
  });
  test('does not disclose invalid key prefixes', async () => {
    vi.mocked(prisma.userApiKey.findUnique).mockResolvedValue(null);
    await expect(verifyUserApiKey(args.requestApiKey)).rejects.toMatchObject({
      status: 401,
      message: 'Invalid API key.',
    });
  });
  test('rejects expired keys with 401', async () => {
    vi.mocked(prisma.userApiKey.findUnique).mockResolvedValue({
      expiredAt: new Date(0),
      user: { id: 'user' },
    } as any);
    await expect(resolveAIGatewayModelApiKey(args)).rejects.toMatchObject({
      status: 401,
    });
  });
});
