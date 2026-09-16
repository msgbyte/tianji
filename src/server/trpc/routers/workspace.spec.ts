import { ROLES } from '@tianji/shared';
import { createId } from '@paralleldrive/cuid2';
import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getWorkspaceUser: vi.fn(),
  findUser: vi.fn(),
  findMember: vi.fn(),
  updateMember: vi.fn(),
  joinWorkspace: vi.fn(),
  createInvitation: vi.fn(),
  sendInvitationEmail: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('../../middleware/auth.js', () => ({
  jwtVerify: () => ({ id: 'actor-id', username: 'actor', role: 'user' }),
}));
vi.mock('../../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../../model/user.js', () => ({
  createUserSelect: {},
  joinWorkspace: mocks.joinWorkspace,
  leaveWorkspace: vi.fn(),
  verifyUserApiKey: vi.fn(),
}));
vi.mock('../../model/_client.js', () => ({
  prisma: {
    user: { findFirst: mocks.findUser },
    workspacesOnUsers: {
      findUnique: mocks.findMember,
      update: mocks.updateMember,
    },
  },
}));
vi.mock('../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
  clearWorkspaceSettingsCache: vi.fn(),
  getWorkspaceServiceCount: vi.fn(),
}));
vi.mock('../../model/auditLog.js', () => ({
  createAuditLog: mocks.audit,
  createWorkspaceMutationAuditLog: mocks.audit,
}));
vi.mock('../../model/invitation.js', () => ({
  acceptInvitation: vi.fn(),
  createWorkspaceInvitation: mocks.createInvitation,
  sendInvitationEmail: mocks.sendInvitationEmail,
}));
vi.mock('../../model/serverStatus.js', () => ({ getServerCount: vi.fn() }));
vi.mock('../../model/monitor/index.js', () => ({ monitorManager: {} }));
vi.mock('../../model/workspace/config.js', () => ({
  getWorkspaceConfig: vi.fn(),
  setWorkspaceConfig: vi.fn(),
}));
vi.mock('../../model/billing/workspace.js', () => ({
  checkWorkspaceUsageAndUpdateStatus: vi.fn(),
}));
vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: () => vi.fn() },
  promWorkspaceCounter: { inc: vi.fn() },
}));

const { workspaceRouter } = await import('./workspace.js');
const { router } = await import('../trpc.js');
const caller = router({ workspace: workspaceRouter }).createCaller({
  token: 'test-token',
  timezone: 'utc',
  language: 'en',
  req: { protocol: 'https', get: () => 'example.com' } as any,
  origin: '',
}).workspace;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getWorkspaceUser.mockResolvedValue({ role: ROLES.admin });
  mocks.createInvitation.mockResolvedValue({ id: 'invitation-id' });
});

test.each([true, false])(
  'invites a write member (existing user: %s)',
  async (existing) => {
    const workspaceId = createId();
    const emailOrId = 'member@example.com';
    mocks.findUser.mockResolvedValue(existing ? { id: 'member-id' } : null);

    await caller.invite({ workspaceId, emailOrId, role: ROLES.write });

    if (existing) {
      expect(mocks.joinWorkspace).toHaveBeenCalledWith(
        'member-id',
        workspaceId,
        ROLES.write
      );
    } else {
      expect(mocks.createInvitation).toHaveBeenCalledWith(
        workspaceId,
        'actor-id',
        emailOrId,
        ROLES.write
      );
      expect(mocks.sendInvitationEmail).toHaveBeenCalledWith(
        'invitation-id',
        'https://example.com'
      );
    }
    expect(mocks.audit).toHaveBeenCalledOnce();
  }
);

test.each([ROLES.readOnly, ROLES.write])(
  '%s cannot invite or change member roles',
  async (role) => {
    mocks.getWorkspaceUser.mockResolvedValue({ role });
    const workspaceId = createId();
    await expect(
      caller.invite({
        workspaceId,
        emailOrId: 'member@example.com',
        role: ROLES.write,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      caller.updateMemberRole({
        workspaceId,
        userId: 'member-id',
        role: ROLES.admin,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mocks.joinWorkspace).not.toHaveBeenCalled();
    expect(mocks.createInvitation).not.toHaveBeenCalled();
    expect(mocks.updateMember).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  }
);

test('an owner can assign the write role to an existing member', async () => {
  const workspaceId = createId();
  mocks.getWorkspaceUser.mockResolvedValue({ role: ROLES.owner });
  mocks.findMember.mockResolvedValue({ role: ROLES.readOnly });
  await caller.updateMemberRole({
    workspaceId,
    userId: 'member-id',
    role: ROLES.write,
  });
  expect(mocks.updateMember).toHaveBeenCalledWith({
    where: { userId_workspaceId: { userId: 'member-id', workspaceId } },
    data: { role: ROLES.write },
  });
  expect(mocks.audit).toHaveBeenCalledOnce();
});
