import { createId } from '@paralleldrive/cuid2';
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

const mocks = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
  getWorkspaceUser: vi.fn(),
  jwtVerify: vi.fn(() => ({
    id: 'user-id',
    username: 'user',
    role: 'user',
  })),
  endRequest: vi.fn(),
}));

vi.mock('../middleware/auth.js', () => ({ jwtVerify: mocks.jwtVerify }));
vi.mock('../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../model/user.js', () => ({ verifyUserApiKey: vi.fn() }));
vi.mock('../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
}));
vi.mock('../model/_client.js', () => ({
  prisma: { workspaceAuditLog: { create: mocks.createAuditLog } },
}));
vi.mock('../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: vi.fn(() => mocks.endRequest) },
}));

const { router, workspaceAdminProcedure, workspaceProcedure } =
  await import('./trpc.js');

const testRouter = router({
  entity: router({
    update: workspaceAdminProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string(),
          apiKey: z.string(),
          nested: z.object({ authorization: z.string(), label: z.string() }),
        })
      )
      .mutation(({ input }) => input),
    fail: workspaceAdminProcedure.mutation(() => {
      throw new TRPCError({ code: 'BAD_REQUEST' });
    }),
    get: workspaceAdminProcedure.query(() => null),
    sync: workspaceAdminProcedure.mutation(() => null),
    memberUpdate: workspaceProcedure
      .input(z.object({ id: z.string(), name: z.string() }))
      .mutation(({ input }) => input),
  }),
  notification: router({
    test: workspaceProcedure.mutation(() => null),
  }),
  aiGateway: router({
    testConnection: workspaceAdminProcedure.mutation(() => null),
  }),
});

const createCaller = () =>
  testRouter.createCaller({
    token: 'jwt-token',
    timezone: 'utc',
    language: 'en',
    req: {} as any,
    origin: '',
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getWorkspaceUser.mockResolvedValue({ role: 'owner' });
  mocks.createAuditLog.mockResolvedValue(undefined);
});

describe('workspace mutation audit log', () => {
  test('records successful privileged mutations with redacted submitted changes only', async () => {
    const workspaceId = createId();
    const caller = createCaller();

    await caller.entity.update({
      workspaceId,
      id: 'target-id',
      name: 'Renamed',
      apiKey: 'top-secret',
      nested: { authorization: 'bearer-secret', label: 'visible' },
    });

    expect(mocks.createAuditLog).toHaveBeenCalledOnce();
    const data = mocks.createAuditLog.mock.calls[0][0].data;
    expect(data).toMatchObject({
      workspaceId,
      relatedId: 'target-id',
    });
    expect(data.content).toContain('entity.update');
    expect(data.content).toContain('user(user-id)');
    expect(data.content).toContain('"name":"Renamed"');
    expect(data.content).toContain('"apiKey":"[REDACTED]"');
    expect(data.content).toContain('"authorization":"[REDACTED]"');
    expect(data.content).toContain('"label":"visible"');
    expect(data.content).not.toContain('top-secret');
    expect(data.content).not.toContain('bearer-secret');
  });

  test('records successful ordinary member mutations', async () => {
    const workspaceId = createId();
    const caller = createCaller();

    await caller.entity.memberUpdate({
      workspaceId,
      id: 'target-id',
      name: 'Renamed by member',
    });

    expect(mocks.createAuditLog).toHaveBeenCalledOnce();
    expect(mocks.createAuditLog.mock.calls[0][0].data).toMatchObject({
      workspaceId,
      relatedId: 'target-id',
    });
  });

  test('records persistent mutations even when their operation name is reused', async () => {
    const workspaceId = createId();
    const caller = createCaller();

    await caller.entity.sync({ workspaceId });

    expect(mocks.createAuditLog).toHaveBeenCalledOnce();
  });

  test('skips failed, read-only, test, and non-persistent operations', async () => {
    const workspaceId = createId();
    const caller = createCaller();

    await expect(caller.entity.fail({ workspaceId })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    await caller.entity.get({ workspaceId });
    await caller.aiGateway.testConnection({ workspaceId });
    await caller.notification.test({ workspaceId });

    expect(mocks.createAuditLog).not.toHaveBeenCalled();
  });
});
