import { createId } from '@paralleldrive/cuid2';
import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getWorkspaceUser: vi.fn(),
  findMonitor: vi.fn(),
  upsert: vi.fn(),
  audit: vi.fn(),
}));
vi.mock('../../middleware/auth.js', () => ({
  jwtVerify: () => ({ id: 'user-id', username: 'user', role: 'user' }),
}));
vi.mock('../../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../../model/user.js', () => ({ verifyUserApiKey: vi.fn() }));
vi.mock('../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
}));
vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: () => vi.fn() },
}));
vi.mock('../../model/_client.js', () => ({
  prisma: { monitor: { findUnique: mocks.findMonitor } },
}));
vi.mock('../../model/auditLog.js', () => ({
  createAuditLog: mocks.audit,
  createWorkspaceMutationAuditLog: mocks.audit,
}));
vi.mock('../../model/monitor/index.js', () => ({
  monitorManager: { upsert: mocks.upsert },
  getMonitorData: vi.fn(),
  getMonitorPublicInfos: vi.fn(),
  getMonitorRecentData: vi.fn(),
  getMonitorSummaryWithDay: vi.fn(),
}));
vi.mock('../../model/notification/token/index.js', () => ({ token: {} }));
vi.mock('../../utils/vm/index.js', () => ({ runCodeInVM: vi.fn() }));

const { monitorRouter } = await import('./monitor.js');
const caller = monitorRouter.createCaller({
  token: 'test-token',
  timezone: 'utc',
  language: 'en',
  req: {} as any,
  origin: '',
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getWorkspaceUser.mockResolvedValue({ role: 'write' });
  mocks.upsert.mockImplementation(async (input) => ({
    ...input,
    id: input.id ?? createId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
});

test.each([{}, { pushToken: '' }, { pushToken: 'replacement-token' }])(
  'editing preserves the existing push token with payload %j',
  async (payload) => {
    const workspaceId = createId();
    const id = createId();
    mocks.findMonitor.mockResolvedValue({
      payload: { pushToken: 'existing-token' },
    });
    for (const type of ['push', 'http']) {
      await caller.upsert({
        workspaceId,
        id,
        name: 'Edited monitor',
        type,
        payload,
      });
      expect(mocks.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          workspaceId,
          id,
          payload: { pushToken: 'existing-token' },
        })
      );
    }
    expect(mocks.audit).toHaveBeenCalledTimes(2);
  }
);

test('write can create monitors but cannot delete or rotate their tokens', async () => {
  const workspaceId = createId();
  const monitor = await caller.upsert({
    workspaceId,
    name: 'New monitor',
    type: 'push',
    payload: {},
  });
  expect(mocks.findMonitor).not.toHaveBeenCalled();
  await expect(
    caller.delete({ workspaceId, monitorId: monitor.id })
  ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await expect(
    caller.regeneratePushToken({ workspaceId, monitorId: monitor.id })
  ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  expect(mocks.audit).toHaveBeenCalledOnce();
});
