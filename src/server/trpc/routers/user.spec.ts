import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authUserWithToken: vi.fn(),
  createAuditLog: vi.fn(),
  createUser: vi.fn(),
  createWorkspaceMutationAuditLog: vi.fn(),
  getUserCount: vi.fn(),
}));

vi.mock('../../model/user.js', () => ({
  authUser: vi.fn(),
  authUserWithToken: mocks.authUserWithToken,
  changeUserPassword: vi.fn(),
  createAdminUser: vi.fn(),
  createUser: mocks.createUser,
  generateUserApiKey: vi.fn(),
  getUserCount: mocks.getUserCount,
  getUserInfo: vi.fn(),
  verifyUserApiKey: vi.fn(),
}));
vi.mock('../../middleware/auth.js', () => ({
  jwtSign: vi.fn(() => 'new-token'),
  jwtVerify: vi.fn(),
}));
vi.mock('../../model/auditLog.js', () => ({
  createAuditLog: mocks.createAuditLog,
  createWorkspaceMutationAuditLog: mocks.createWorkspaceMutationAuditLog,
}));
vi.mock('../../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../../model/_client.js', () => ({ prisma: {} }));
vi.mock('../../model/workspace.js', () => ({ getWorkspaceUser: vi.fn() }));
vi.mock('../../utils/env.js', () => ({ env: { allowRegister: true } }));
vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: vi.fn(() => vi.fn()) },
}));

const { userRouter } = await import('./user.js');

const user = {
  id: 'user-id',
  role: 'user',
  username: 'user',
  nickname: null,
  avatar: null,
  email: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  currentWorkspaceId: 'workspace-id',
  workspaces: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authUserWithToken.mockResolvedValue(user);
  mocks.getUserCount.mockResolvedValue(1);
  mocks.createUser.mockResolvedValue(user);
});

test('records token login and registration without exposing credentials', async () => {
  const caller = userRouter.createCaller({
    token: '',
    timezone: 'utc',
    language: 'en',
    req: {} as any,
    origin: '',
  });

  await caller.loginWithToken({ token: 'secret-token' });
  await caller.register({ username: 'user', password: 'secret-password' });

  expect(mocks.createAuditLog).toHaveBeenCalledWith({
    workspaceId: 'workspace-id',
    relatedId: 'user-id',
    relatedType: 'User',
    content: 'User login with token: user',
  });
  expect(mocks.createWorkspaceMutationAuditLog).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'user.register',
      input: { username: 'user' },
    })
  );
});
