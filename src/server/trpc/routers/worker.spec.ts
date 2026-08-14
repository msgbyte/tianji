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
    findWorker: vi.fn(),
    findEnvironmentVariables: vi.fn(),
    upsertWorker: vi.fn(),
    createAuditLog: vi.fn(),
    execWorker: vi.fn(),
    execStoredWorker: vi.fn(),
    resolveWorkerEnvironmentForExecution: vi.fn(),
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
    functionWorker: {
      findUnique: mocks.findWorker,
    },
    functionWorkerEnvironmentVariable: {
      findMany: mocks.findEnvironmentVariables,
    },
  },
}));

vi.mock('../../model/auditLog.js', () => ({
  createAuditLog: mocks.createAuditLog,
}));

vi.mock('../../model/worker/index.js', () => ({
  execWorker: mocks.execWorker,
  execStoredWorker: mocks.execStoredWorker,
}));

vi.mock('../../model/worker/environment.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../model/worker/environment.js')>()),
  resolveWorkerEnvironmentForExecution:
    mocks.resolveWorkerEnvironmentForExecution,
}));

vi.mock('../../model/worker/manager.js', () => ({
  workerCronManager: {
    upsert: mocks.upsertWorker,
    delete: vi.fn(),
  },
}));

vi.mock('../../utils/env.js', () => ({
  env: { enableFunctionWorker: true },
}));

async function createCaller() {
  const { workerRouter } = await import('./worker.js');

  return workerRouter.createCaller({
    token: 'jwt-token',
    timezone: 'utc',
    language: 'en',
    req: {} as any,
    origin: '',
  });
}

function worker(workspaceId: string, id = createId()) {
  return {
    id,
    workspaceId,
    name: 'Worker',
    description: null,
    code: 'return true;',
    revision: 1,
    active: true,
    enableCron: false,
    cronExpression: null,
    visibility: 'Public' as const,
    createdAt: new Date('2026-08-15T00:00:00.000Z'),
    updatedAt: new Date('2026-08-15T00:00:00.000Z'),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getWorkspaceUser.mockResolvedValue({ role: 'owner' });
  mocks.createAuditLog.mockResolvedValue(undefined);
  mocks.execWorker.mockResolvedValue({ status: 'Success' });
  mocks.execStoredWorker.mockResolvedValue({ status: 'Success' });
  mocks.resolveWorkerEnvironmentForExecution.mockResolvedValue({
    environment: {},
    secretValues: [],
  });
});

afterEach(() => {
  vi.resetModules();
});

describe('workerRouter environment variables', () => {
  test('returns Text values and no Secret values', async () => {
    const workspaceId = createId();
    const workerId = createId();
    mocks.findWorker.mockResolvedValue({ id: workerId });
    mocks.findEnvironmentVariables.mockResolvedValue([
      { id: 'text', key: 'API_URL', type: 'Text', value: 'https://example.com' },
      { id: 'secret', key: 'TOKEN', type: 'Secret', value: 'never-return' },
    ]);
    const caller = await createCaller();

    const result = await caller.getEnvironmentVariables({ workspaceId, workerId });

    expect(result).toEqual([
      { id: 'text', key: 'API_URL', type: 'Text', value: 'https://example.com' },
      { id: 'secret', key: 'TOKEN', type: 'Secret', hasValue: true },
    ]);
    expect(JSON.stringify(result)).not.toContain('never-return');
    expect(mocks.findWorker).toHaveBeenCalledWith({
      where: { id: workerId, workspaceId },
      select: { id: true },
    });
    expect(mocks.findEnvironmentVariables).toHaveBeenCalledWith({
      where: { workerId },
      orderBy: { createdAt: 'asc' },
    });
  });

  test('returns NOT_FOUND for a worker outside the current workspace', async () => {
    const workspaceId = createId();
    mocks.findWorker.mockResolvedValue(null);
    const caller = await createCaller();

    await expect(
      caller.getEnvironmentVariables({ workspaceId, workerId: createId() })
    ).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'Worker not found' });
    expect(mocks.findEnvironmentVariables).not.toHaveBeenCalled();
  });

  test('forwards environment inputs to upsert without returning Secret values', async () => {
    const workspaceId = createId();
    const savedWorker = worker(workspaceId);
    const secret = 'never-return';
    mocks.upsertWorker.mockResolvedValue(savedWorker);
    const caller = await createCaller();

    const result = await caller.upsert({
      workspaceId,
      name: savedWorker.name,
      code: savedWorker.code,
      environmentVariables: [
        { key: 'API_URL', type: 'Text', value: 'https://example.com' },
        { key: 'TOKEN', type: 'Secret', value: secret },
      ],
    });

    expect(mocks.upsertWorker).toHaveBeenCalledWith({
      id: undefined,
      workspaceId,
      name: savedWorker.name,
      description: undefined,
      code: savedWorker.code,
      active: true,
      enableCron: false,
      cronExpression: null,
      environmentVariables: [
        { key: 'API_URL', type: 'Text', value: 'https://example.com' },
        { key: 'TOKEN', type: 'Secret', value: secret },
      ],
    });
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  test('executes a stored worker with fresh saved environment resolution', async () => {
    const workspaceId = createId();
    const storedWorker = worker(workspaceId);
    const payload = { action: 'run' };
    mocks.findWorker.mockResolvedValue(storedWorker);
    const caller = await createCaller();

    await caller.execute({ workspaceId, workerId: storedWorker.id, payload });

    expect(mocks.execStoredWorker).toHaveBeenCalledWith(storedWorker, payload, {
      type: 'manual',
    });
    expect(mocks.execWorker).not.toHaveBeenCalled();
  });

  test('resolves authorized saved and draft environment for test-code execution', async () => {
    const workspaceId = createId();
    const storedWorker = worker(workspaceId);
    const drafts = [
      { id: createId(), key: 'TOKEN', type: 'Secret' as const },
    ];
    mocks.findWorker.mockResolvedValue({ id: storedWorker.id });
    mocks.resolveWorkerEnvironmentForExecution.mockResolvedValue({
      environment: { TOKEN: 'saved-secret' },
      secretValues: ['saved-secret'],
    });
    const caller = await createCaller();

    await caller.testCode({
      workspaceId,
      workerId: storedWorker.id,
      code: storedWorker.code,
      environmentVariables: drafts,
    });

    expect(mocks.findWorker).toHaveBeenCalledWith({
      where: { id: storedWorker.id, workspaceId },
      select: { id: true },
    });
    expect(mocks.resolveWorkerEnvironmentForExecution).toHaveBeenCalledWith(
      storedWorker.id,
      drafts
    );
    expect(mocks.execWorker).toHaveBeenCalledWith(
      storedWorker.code,
      {
        scope: {
          kind: 'test',
          workspaceId,
          executionId: expect.any(String),
        },
        requestPayload: undefined,
        context: { type: 'test' },
        environment: { TOKEN: 'saved-secret' },
        secretValues: ['saved-secret'],
      }
    );
  });

  test('creates a fresh workspace-scoped identity for every code test', async () => {
    const workspaceId = createId();
    const caller = await createCaller();

    await caller.testCode({ workspaceId, code: 'return true;' });
    await caller.testCode({ workspaceId, code: 'return true;' });

    const firstScope = mocks.execWorker.mock.calls[0][1].scope;
    const secondScope = mocks.execWorker.mock.calls[1][1].scope;
    expect(firstScope).toMatchObject({ kind: 'test', workspaceId });
    expect(firstScope.executionId).toEqual(expect.any(String));
    expect(secondScope).toMatchObject({ kind: 'test', workspaceId });
    expect(secondScope.executionId).not.toBe(firstScope.executionId);
  });

  test('does not resolve saved environment for a worker outside the workspace', async () => {
    const workspaceId = createId();
    const workerId = createId();
    mocks.findWorker.mockResolvedValue(null);
    const caller = await createCaller();

    await expect(
      caller.testCode({ workspaceId, workerId, code: 'return true;' })
    ).rejects.toThrow('Worker not found');

    expect(mocks.resolveWorkerEnvironmentForExecution).not.toHaveBeenCalled();
    expect(mocks.execWorker).not.toHaveBeenCalled();
  });
});
