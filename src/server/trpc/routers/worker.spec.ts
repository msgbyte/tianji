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
    getWorkspaceUser: vi.fn(
      async (_workspaceId: string, _userId: string) => ({ role: 'owner' })
    ),
    promStartTimer: vi.fn(() => endRequest),
    findWorker: vi.fn(),
    findWorkers: vi.fn(),
    findEnvironmentVariables: vi.fn(),
    findWorkerRevisions: vi.fn(),
    upsertWorker: vi.fn(),
    createAuditLog: vi.fn(),
    execWorker: vi.fn(),
    execStoredWorker: vi.fn(),
    resolveWorkerEnvironmentForExecution: vi.fn(),
    resolveWorkerModuleBindingsFromCode: vi.fn(
      async () =>
        [] as Array<{
          moduleId: string;
          moduleRevisionId: string;
          importAlias: string;
        }>
    ),
    validateWorkerModuleBindings: vi.fn(async () => undefined),
    loadModuleArtifactsForBindings: vi.fn(
      async () => [] as Array<{ importAlias: string; compiledCode: string }>
    ),
    loadWorkerModuleArtifacts: vi.fn(async () => []),
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
      findMany: mocks.findWorkers,
    },
    functionWorkerEnvironmentVariable: {
      findMany: mocks.findEnvironmentVariables,
    },
    functionWorkerRevision: {
      findMany: mocks.findWorkerRevisions,
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

vi.mock('../../model/sharedModule/bindings.js', () => ({
  resolveWorkerModuleBindingsFromCode:
    mocks.resolveWorkerModuleBindingsFromCode,
  validateWorkerModuleBindings: mocks.validateWorkerModuleBindings,
  loadModuleArtifactsForBindings: mocks.loadModuleArtifactsForBindings,
  loadWorkerModuleArtifacts: mocks.loadWorkerModuleArtifacts,
  wrapSharedModuleDeclaration: (alias: string, declaration: string) =>
    `declare module '${alias}' {\n${declaration}\n}\n`,
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
    creatorId: null,
    ownerId: null,
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
      creatorId: 'user-id',
      operatorId: 'user-id',
      ownerId: 'user-id',
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

  test('persists module bindings inferred from worker imports', async () => {
    const workspaceId = createId();
    const savedWorker = worker(workspaceId);
    const code = `import { sendAlert } from '@shared/alert';`;
    const inferredBindings = [
      {
        moduleId: createId(),
        moduleRevisionId: createId(),
        importAlias: '@shared/alert',
      },
    ];
    mocks.resolveWorkerModuleBindingsFromCode.mockResolvedValueOnce(
      inferredBindings
    );
    mocks.upsertWorker.mockResolvedValue({ ...savedWorker, code });
    const caller = await createCaller();

    await caller.upsert({ workspaceId, name: savedWorker.name, code });

    expect(mocks.resolveWorkerModuleBindingsFromCode).toHaveBeenCalledWith(
      workspaceId,
      code,
      []
    );
    expect(mocks.validateWorkerModuleBindings).toHaveBeenCalledWith(
      workspaceId,
      inferredBindings,
      { allowedArchivedBindings: [] }
    );
    expect(mocks.upsertWorker).toHaveBeenCalledWith(
      expect.objectContaining({ moduleBindings: inferredBindings })
    );
  });

  test('returns each revision with its operator identity', async () => {
    const workspaceId = createId();
    const workerId = createId();
    const operatorId = createId();
    const operator = {
      id: operatorId,
      username: 'operator',
      nickname: 'Worker Operator',
      avatar: 'https://example.com/operator.png',
    };
    mocks.findWorker.mockResolvedValue({ id: workerId });
    mocks.findWorkerRevisions.mockResolvedValue([
      {
        id: createId(),
        workerId,
        operatorId,
        revision: 1,
        code: 'return true;',
        createdAt: new Date('2026-08-17T00:00:00.000Z'),
        operator,
      },
    ]);
    const caller = await createCaller();

    const result = await caller.getRevisions({ workspaceId, workerId });

    expect(result[0]?.operator).toEqual(operator);
    expect(mocks.findWorkerRevisions).toHaveBeenCalledWith({
      where: { workerId },
      include: {
        operator: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { revision: 'desc' },
    });
  });

  test('returns creator and owner profiles for workspace worker queries', async () => {
    const workspaceId = createId();
    const savedWorker = worker(workspaceId);
    const creator = {
      id: 'user-id',
      username: 'user',
      nickname: 'Maintainer',
      avatar: null,
    };
    const owner = {
      id: 'owner-id',
      username: 'owner',
      nickname: null,
      avatar: null,
    };
    mocks.findWorker.mockResolvedValue({ ...savedWorker, creator, owner });
    const caller = await createCaller();

    const result = await caller.get({ workspaceId, workerId: savedWorker.id });

    expect(result?.creator).toEqual(creator);
    expect(result?.owner).toEqual(owner);
    expect(mocks.findWorker).toHaveBeenCalledWith({
      where: { id: savedWorker.id, workspaceId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });
  });

  test('allows a readonly worker owner to update the worker', async () => {
    const workspaceId = createId();
    const savedWorker = {
      ...worker(workspaceId),
      ownerId: 'user-id',
    };
    mocks.getWorkspaceUser.mockResolvedValue({ role: 'readOnly' });
    mocks.findWorker.mockResolvedValue({ ownerId: 'user-id' });
    mocks.upsertWorker.mockResolvedValue(savedWorker);
    const caller = await createCaller();

    await caller.upsert({
      id: savedWorker.id,
      workspaceId,
      name: savedWorker.name,
      code: savedWorker.code,
    });

    expect(mocks.upsertWorker).toHaveBeenCalledWith(
      expect.objectContaining({ id: savedWorker.id, ownerId: undefined })
    );
  });

  test('denies a readonly non-owner from updating the worker', async () => {
    const workspaceId = createId();
    const savedWorker = worker(workspaceId);
    mocks.getWorkspaceUser.mockResolvedValue({ role: 'readOnly' });
    mocks.findWorker.mockResolvedValue({ ownerId: 'another-user' });
    const caller = await createCaller();

    await expect(
      caller.upsert({
        id: savedWorker.id,
        workspaceId,
        name: savedWorker.name,
        code: savedWorker.code,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mocks.upsertWorker).not.toHaveBeenCalled();
  });

  test('does not trust a requested ownerId when authorizing an update', async () => {
    const workspaceId = createId();
    const requestUserId = createId();
    const savedWorker = worker(workspaceId);
    mocks.jwtVerify.mockReturnValueOnce({
      id: requestUserId,
      username: 'user',
      role: 'user',
    });
    mocks.getWorkspaceUser.mockResolvedValue({ role: 'readOnly' });
    mocks.findWorker.mockResolvedValue({ ownerId: 'another-user' });
    const caller = await createCaller();

    await expect(
      caller.upsert({
        id: savedWorker.id,
        workspaceId,
        ownerId: requestUserId,
        name: savedWorker.name,
        code: savedWorker.code,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mocks.upsertWorker).not.toHaveBeenCalled();
  });

  test('allows an admin to assign a readonly workspace member as owner', async () => {
    const workspaceId = createId();
    const readonlyUserId = createId();
    const savedWorker = worker(workspaceId);
    mocks.getWorkspaceUser.mockImplementation(async (_workspaceId, userId) =>
      userId === readonlyUserId ? { role: 'readOnly' } : { role: 'admin' }
    );
    mocks.findWorker.mockResolvedValue({ ownerId: 'user-id' });
    mocks.upsertWorker.mockResolvedValue({
      ...savedWorker,
      ownerId: readonlyUserId,
    });
    const caller = await createCaller();

    await caller.upsert({
      id: savedWorker.id,
      workspaceId,
      ownerId: readonlyUserId,
      name: savedWorker.name,
      code: savedWorker.code,
    });

    expect(mocks.getWorkspaceUser).toHaveBeenCalledWith(
      workspaceId,
      readonlyUserId
    );
    expect(mocks.upsertWorker).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: readonlyUserId })
    );
  });

  test('denies a readonly owner from transferring ownership', async () => {
    const workspaceId = createId();
    const nextOwnerId = createId();
    const savedWorker = {
      ...worker(workspaceId),
      ownerId: 'user-id',
    };
    mocks.getWorkspaceUser.mockResolvedValue({ role: 'readOnly' });
    mocks.findWorker.mockResolvedValue({ ownerId: 'user-id' });
    const caller = await createCaller();

    await expect(
      caller.upsert({
        id: savedWorker.id,
        workspaceId,
        ownerId: nextOwnerId,
        name: savedWorker.name,
        code: savedWorker.code,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mocks.upsertWorker).not.toHaveBeenCalled();
  });

  test('executes a stored worker with fresh saved environment resolution', async () => {
    const workspaceId = createId();
    const storedWorker = worker(workspaceId);
    const payload = { action: 'run' };
    mocks.findWorker.mockResolvedValue(storedWorker);
    const caller = await createCaller();

    await caller.execute({ workspaceId, workerId: storedWorker.id, payload });

    expect(mocks.findWorker).toHaveBeenCalledWith({
      where: { id: storedWorker.id, workspaceId },
    });
    expect(mocks.execStoredWorker).toHaveBeenCalledWith(storedWorker, payload, {
      type: 'manual',
    });
    expect(mocks.execWorker).not.toHaveBeenCalled();
  });

  test('denies manual execution when the worker belongs to another workspace', async () => {
    const workspaceId = createId();
    const workerId = createId();
    mocks.findWorker.mockResolvedValue(null);
    const caller = await createCaller();

    await expect(
      caller.execute({ workspaceId, workerId })
    ).rejects.toThrow('Worker not found');

    expect(mocks.findWorker).toHaveBeenCalledWith({
      where: { id: workerId, workspaceId },
    });
    expect(mocks.execStoredWorker).not.toHaveBeenCalled();
    expect(mocks.createAuditLog).not.toHaveBeenCalled();
  });

  test('resolves authorized saved and draft environment for test-code execution', async () => {
    const workspaceId = createId();
    const storedWorker = worker(workspaceId);
    const drafts = [
      { id: createId(), key: 'TOKEN', type: 'Secret' as const },
    ];
    mocks.findWorker.mockResolvedValue({
      id: storedWorker.id,
      ownerId: 'user-id',
    });
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
      select: {
        id: true,
        ownerId: true,
        moduleBindings: {
          select: {
            moduleId: true,
            moduleRevisionId: true,
            importAlias: true,
          },
        },
      },
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
        modules: [],
      }
    );
  });

  test('loads inferred module artifacts when testing unsaved imports', async () => {
    const workspaceId = createId();
    const storedWorker = worker(workspaceId);
    const code = `import { sendAlert } from '@shared/alert';`;
    const inferredBindings = [
      {
        moduleId: createId(),
        moduleRevisionId: createId(),
        importAlias: '@shared/alert',
      },
    ];
    const artifacts = [
      { importAlias: '@shared/alert', compiledCode: 'export const value = 1;' },
    ];
    mocks.findWorker.mockResolvedValue({
      id: storedWorker.id,
      ownerId: 'user-id',
      moduleBindings: [],
    });
    mocks.resolveWorkerModuleBindingsFromCode.mockResolvedValueOnce(
      inferredBindings
    );
    mocks.loadModuleArtifactsForBindings.mockResolvedValueOnce(artifacts);
    const caller = await createCaller();

    await caller.testCode({
      workspaceId,
      workerId: storedWorker.id,
      code,
    });

    expect(mocks.loadModuleArtifactsForBindings).toHaveBeenCalledWith(
      inferredBindings
    );
    expect(mocks.execWorker).toHaveBeenCalledWith(
      code,
      expect.objectContaining({ modules: artifacts })
    );
  });

  test('allows a readonly worker owner to test saved worker code', async () => {
    const workspaceId = createId();
    const storedWorker = worker(workspaceId);
    mocks.getWorkspaceUser.mockResolvedValue({ role: 'readOnly' });
    mocks.findWorker.mockResolvedValue({
      id: storedWorker.id,
      ownerId: 'user-id',
    });
    const caller = await createCaller();

    await caller.testCode({
      workspaceId,
      workerId: storedWorker.id,
      code: storedWorker.code,
    });

    expect(mocks.execWorker).toHaveBeenCalledOnce();
  });

  test('denies a readonly non-owner from testing saved worker code', async () => {
    const workspaceId = createId();
    const storedWorker = worker(workspaceId);
    mocks.getWorkspaceUser.mockResolvedValue({ role: 'readOnly' });
    mocks.findWorker.mockResolvedValue({
      id: storedWorker.id,
      ownerId: 'another-user',
    });
    const caller = await createCaller();

    await expect(
      caller.testCode({
        workspaceId,
        workerId: storedWorker.id,
        code: storedWorker.code,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(mocks.execWorker).not.toHaveBeenCalled();
  });

  test('keeps draft code testing restricted to workspace admins', async () => {
    const workspaceId = createId();
    mocks.getWorkspaceUser.mockResolvedValue({ role: 'readOnly' });
    const caller = await createCaller();

    await expect(
      caller.testCode({ workspaceId, code: 'return true;' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    expect(mocks.execWorker).not.toHaveBeenCalled();
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
