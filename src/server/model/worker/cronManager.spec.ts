import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const runnerInstances: Array<{
    workspace: any;
    worker: any;
    startCron: ReturnType<typeof vi.fn>;
    stopCron: ReturnType<typeof vi.fn>;
  }> = [];

  class WorkerCronRunner {
    startCron = vi.fn(async () => undefined);
    stopCron = vi.fn(async () => undefined);

    constructor(
      public workspace: any,
      public worker: any
    ) {
      runnerInstances.push(this);
    }
  }

  const prisma = {
    functionWorker: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    functionWorkerRevision: {
      create: vi.fn(),
    },
    workspace: {
      findUniqueOrThrow: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  return {
    runnerInstances,
    WorkerCronRunner,
    prisma,
    delWorkerCache: vi.fn(),
    workerCronBroadcast: {
      publish: vi.fn(async () => undefined),
    },
  };
});

vi.mock('../_client.js', () => ({ prisma: mocks.prisma }));
vi.mock('./cronRunner.js', () => ({
  WorkerCronRunner: mocks.WorkerCronRunner,
}));
vi.mock('./index.js', () => ({
  delWorkerCache: mocks.delWorkerCache,
}));
vi.mock('./broadcast.js', () => ({
  workerCronBroadcast: mocks.workerCronBroadcast,
}));

import { WorkerCronManager } from './cronManager.js';
import type {
  WorkerCronBroadcastAction,
  WorkerCronBroadcastEvent,
} from './broadcast.js';

const workspace = {
  id: 'workspace-a',
  name: 'Workspace A',
  settings: {},
};

const activeWorker = {
  id: 'worker-a',
  workspaceId: 'workspace-a',
  name: 'Worker A',
  description: null,
  code: 'return "current";',
  revision: 1,
  active: true,
  enableCron: true,
  cronExpression: '*/10 * * * *',
  visibility: 'Public',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const oldWorker = {
  ...activeWorker,
  code: 'return "old";',
  cronExpression: '*/5 * * * *',
  revision: 1,
};

const updatedWorker = {
  ...activeWorker,
  code: 'return "new";',
  cronExpression: '*/30 * * * *',
  revision: 2,
};

const upsertInput = {
  workspaceId: 'workspace-a',
  name: 'Worker A',
  description: undefined,
  code: updatedWorker.code,
  active: true,
  enableCron: true,
  cronExpression: updatedWorker.cronExpression,
};

function remoteEvent(
  action: WorkerCronBroadcastAction,
  workerId = 'worker-a',
  workspaceId = 'workspace-a'
): WorkerCronBroadcastEvent {
  return {
    action,
    workspaceId,
    workerId,
    sourceInstanceId: 'instance-b',
  };
}

function seedRunner(manager: WorkerCronManager, worker = oldWorker) {
  const runner = new mocks.WorkerCronRunner(workspace, worker);
  (manager as any).workerRunners[worker.id] = runner;
  return runner;
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.runnerInstances.length = 0;
  mocks.prisma.workspace.findUniqueOrThrow.mockResolvedValue(workspace);
  mocks.prisma.functionWorkerRevision.create.mockResolvedValue({});
  mocks.prisma.$transaction.mockImplementation(async (operation: any) =>
    operation(mocks.prisma)
  );
  mocks.workerCronBroadcast.publish.mockResolvedValue(undefined);
});

describe('WorkerCronManager lifecycle synchronization', () => {
  test('remote update replaces stale cron expression and worker code', async () => {
    const manager = new WorkerCronManager();
    const oldRunner = seedRunner(manager);
    mocks.prisma.functionWorker.findUnique.mockResolvedValue(updatedWorker);

    await manager.handleBroadcast(remoteEvent('update'));

    expect(mocks.prisma.functionWorker.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'worker-a',
        workspaceId: 'workspace-a',
      },
    });
    expect(oldRunner.stopCron).toHaveBeenCalledOnce();
    expect(mocks.runnerInstances).toHaveLength(2);
    expect(mocks.runnerInstances[1].worker.cronExpression).toBe(
      '*/30 * * * *'
    );
    expect(mocks.runnerInstances[1].worker.code).toBe('return "new";');
    expect(mocks.runnerInstances[1].startCron).toHaveBeenCalledOnce();
    expect(manager.getRunner('worker-a')).toBe(mocks.runnerInstances[1]);
  });

  test.each([
    ['missing', null],
    ['inactive', { ...updatedWorker, active: false }],
    ['cron-disabled', { ...updatedWorker, enableCron: false }],
    ['expression-missing', { ...updatedWorker, cronExpression: null }],
  ])('remote event removes a runner for %s state', async (_name, state) => {
    const manager = new WorkerCronManager();
    const oldRunner = seedRunner(manager);
    mocks.prisma.functionWorker.findUnique.mockResolvedValue(state);

    await manager.handleBroadcast(remoteEvent('delete'));

    expect(oldRunner.stopCron).toHaveBeenCalledOnce();
    expect(manager.getRunner('worker-a')).toBeUndefined();
    expect(mocks.runnerInstances).toHaveLength(1);
  });

  test('serializes overlapping reconciliation for one worker', async () => {
    const manager = new WorkerCronManager();
    const firstWorkspaceLookup = deferred<typeof workspace>();
    mocks.prisma.functionWorker.findUnique.mockResolvedValue(updatedWorker);
    mocks.prisma.workspace.findUniqueOrThrow
      .mockReturnValueOnce(firstWorkspaceLookup.promise)
      .mockResolvedValueOnce(workspace);

    const first = manager.reconcile('workspace-a', 'worker-a');
    await vi.waitFor(() => {
      expect(mocks.prisma.workspace.findUniqueOrThrow).toHaveBeenCalledOnce();
    });
    const second = manager.reconcile('workspace-a', 'worker-a');

    expect(mocks.prisma.functionWorker.findUnique).toHaveBeenCalledOnce();
    firstWorkspaceLookup.resolve(workspace);
    await first;
    await second;

    expect(mocks.prisma.functionWorker.findUnique).toHaveBeenCalledTimes(2);
    expect(mocks.runnerInstances).toHaveLength(2);
    expect(mocks.runnerInstances[0].stopCron).toHaveBeenCalledOnce();
    expect(manager.getRunner('worker-a')).toBe(mocks.runnerInstances[1]);
  });

  test('does not globally serialize different workers', async () => {
    const manager = new WorkerCronManager();
    const workspaceALookup = deferred<typeof workspace>();
    const workerB = {
      ...updatedWorker,
      id: 'worker-b',
      workspaceId: 'workspace-b',
    };
    mocks.prisma.functionWorker.findUnique.mockImplementation(
      ({ where }: any) =>
        Promise.resolve(where.id === 'worker-a' ? updatedWorker : workerB)
    );
    mocks.prisma.workspace.findUniqueOrThrow.mockImplementation(
      ({ where }: any) =>
        where.id === 'workspace-a'
          ? workspaceALookup.promise
          : Promise.resolve({ ...workspace, id: 'workspace-b' })
    );

    const first = manager.reconcile('workspace-a', 'worker-a');
    const second = manager.reconcile('workspace-b', 'worker-b');

    await second;
    expect(manager.getRunner('worker-b')).toBeDefined();
    expect(manager.getRunner('worker-a')).toBeUndefined();

    workspaceALookup.resolve(workspace);
    await first;
  });

  test('continues a worker queue after a rejected operation', async () => {
    const manager = new WorkerCronManager();
    mocks.prisma.functionWorker.findUnique
      .mockRejectedValueOnce(new Error('lookup failed'))
      .mockResolvedValueOnce(updatedWorker);

    await expect(
      manager.reconcile('workspace-a', 'worker-a')
    ).rejects.toThrow('lookup failed');
    await expect(
      manager.reconcile('workspace-a', 'worker-a')
    ).resolves.toBeUndefined();

    expect(manager.getRunner('worker-a')).toBeDefined();
  });

  test('failed workspace lookup preserves the old runner', async () => {
    const manager = new WorkerCronManager();
    const oldRunner = seedRunner(manager);
    mocks.prisma.functionWorker.findUnique.mockResolvedValue(updatedWorker);
    mocks.prisma.workspace.findUniqueOrThrow.mockRejectedValue(
      new Error('workspace unavailable')
    );

    await expect(
      manager.reconcile('workspace-a', 'worker-a')
    ).rejects.toThrow('workspace unavailable');

    expect(oldRunner.stopCron).not.toHaveBeenCalled();
    expect(manager.getRunner('worker-a')).toBe(oldRunner);
  });

  test('reconcileAll starts missing runners and removes stale runners', async () => {
    const manager = new WorkerCronManager();
    const staleRunner = seedRunner(manager);
    const workerB = {
      ...updatedWorker,
      id: 'worker-b',
      workspaceId: 'workspace-b',
    };
    mocks.prisma.functionWorker.findMany.mockResolvedValue([
      { id: 'worker-b', workspaceId: 'workspace-b' },
    ]);
    mocks.prisma.functionWorker.findUnique.mockImplementation(
      ({ where }: any) =>
        Promise.resolve(where.id === 'worker-b' ? workerB : null)
    );
    mocks.prisma.workspace.findUniqueOrThrow.mockResolvedValue({
      ...workspace,
      id: 'workspace-b',
    });

    await manager.reconcileAll();

    expect(staleRunner.stopCron).toHaveBeenCalledOnce();
    expect(manager.getRunner('worker-a')).toBeUndefined();
    expect(manager.getRunner('worker-b')).toBeDefined();
    expect(manager.getRunner('worker-b')?.worker.code).toBe(
      'return "new";'
    );
  });

  test('successful update publishes after persistence and applies the returned row', async () => {
    const manager = new WorkerCronManager();
    seedRunner(manager);
    mocks.prisma.functionWorker.findUnique.mockResolvedValue(oldWorker);
    mocks.prisma.functionWorker.update.mockResolvedValue(updatedWorker);

    const result = await manager.upsert({
      ...upsertInput,
      id: 'worker-a',
    });

    expect(result).toBe(updatedWorker);
    expect(mocks.workerCronBroadcast.publish).toHaveBeenCalledWith(
      'update',
      'workspace-a',
      'worker-a'
    );
    expect(manager.getRunner('worker-a')?.worker.code).toBe(
      'return "new";'
    );
  });

  test('successful create publishes the generated worker id', async () => {
    const manager = new WorkerCronManager();
    mocks.prisma.functionWorker.create.mockResolvedValue(updatedWorker);

    await manager.upsert(upsertInput);

    expect(mocks.workerCronBroadcast.publish).toHaveBeenCalledWith(
      'create',
      'workspace-a',
      'worker-a'
    );
    expect(manager.getRunner('worker-a')?.worker.cronExpression).toBe(
      '*/30 * * * *'
    );
  });

  test('delete publishes only after successful persistence', async () => {
    const manager = new WorkerCronManager();
    const oldRunner = seedRunner(manager);
    mocks.prisma.functionWorker.delete.mockResolvedValue(oldWorker);

    await manager.delete('workspace-a', 'worker-a');

    expect(oldRunner.stopCron).toHaveBeenCalledOnce();
    expect(manager.getRunner('worker-a')).toBeUndefined();
    expect(mocks.workerCronBroadcast.publish).toHaveBeenCalledWith(
      'delete',
      'workspace-a',
      'worker-a'
    );
  });

  test('failed deletion preserves the runner and is not broadcast', async () => {
    const manager = new WorkerCronManager();
    const oldRunner = seedRunner(manager);
    mocks.prisma.functionWorker.delete.mockRejectedValue(
      new Error('delete failed')
    );

    await expect(
      manager.delete('workspace-a', 'worker-a')
    ).rejects.toThrow('delete failed');

    expect(oldRunner.stopCron).not.toHaveBeenCalled();
    expect(manager.getRunner('worker-a')).toBe(oldRunner);
    expect(mocks.workerCronBroadcast.publish).not.toHaveBeenCalled();
  });
});
