import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const runnerInstances: Array<{
    workspace: any;
    monitor: any;
    startMonitor: ReturnType<typeof vi.fn>;
    stopMonitor: ReturnType<typeof vi.fn>;
  }> = [];

  class MonitorRunner {
    startMonitor = vi.fn(async () => undefined);
    stopMonitor = vi.fn();

    constructor(
      public workspace: any,
      public monitor: any
    ) {
      runnerInstances.push(this);
    }
  }

  return {
    runnerInstances,
    MonitorRunner,
    prisma: {
      monitor: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      workspace: {
        findUniqueOrThrow: vi.fn(),
      },
    },
    monitorBroadcast: {
      publish: vi.fn(async () => undefined),
    },
    runnerCounter: {
      set: vi.fn(),
    },
  };
});

vi.mock('../_client.js', () => ({ prisma: mocks.prisma }));
vi.mock('./runner.js', () => ({ MonitorRunner: mocks.MonitorRunner }));
vi.mock('./broadcast.js', () => ({
  monitorBroadcast: mocks.monitorBroadcast,
}));
vi.mock('../../utils/prometheus/client.js', () => ({
  promMonitorRunnerCounter: mocks.runnerCounter,
}));

import { MonitorManager } from './manager.js';
import type {
  MonitorBroadcastAction,
  MonitorBroadcastEvent,
} from './broadcast.js';

const workspace = {
  id: 'workspace-a',
  name: 'Workspace A',
};

const activeMonitor = {
  id: 'monitor-a',
  workspaceId: 'workspace-a',
  name: 'API',
  type: 'http',
  active: true,
  interval: 60,
  maxRetries: 0,
  trendingMode: false,
  payload: { url: 'https://example.com' },
  notifications: [],
  upMessageTemplate: null,
  downMessageTemplate: null,
};

const createInput = {
  workspaceId: 'workspace-a',
  name: 'API',
  type: 'http',
  active: true,
  interval: 60,
  maxRetries: 0,
  trendingMode: false,
  payload: { url: 'https://example.com' },
  notificationIds: [],
  upMessageTemplate: null,
  downMessageTemplate: null,
};

function remoteEvent(action: MonitorBroadcastAction): MonitorBroadcastEvent {
  return {
    action,
    workspaceId: 'workspace-a',
    monitorId: 'monitor-a',
    sourceInstanceId: 'instance-b',
  };
}

function seedRunner(manager: MonitorManager) {
  const runner = new mocks.MonitorRunner(workspace, activeMonitor);
  (manager as any).monitorRunner[activeMonitor.id] = runner;
  return runner;
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.runnerInstances.length = 0;
  mocks.prisma.workspace.findUniqueOrThrow.mockResolvedValue(workspace);
  mocks.monitorBroadcast.publish.mockResolvedValue(undefined);
});

describe('MonitorManager broadcast lifecycle', () => {
  test('remote start reloads active state and starts a runner', async () => {
    const manager = new MonitorManager();
    mocks.prisma.monitor.findUnique.mockResolvedValue(activeMonitor);

    await manager.handleBroadcast(remoteEvent('start'));

    expect(mocks.prisma.monitor.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'monitor-a',
        workspaceId: 'workspace-a',
      },
      include: {
        notifications: true,
      },
    });
    expect(mocks.runnerInstances).toHaveLength(1);
    expect(mocks.runnerInstances[0].startMonitor).toHaveBeenCalledOnce();
  });

  test('remote update stops the old runner and starts a fresh runner', async () => {
    const manager = new MonitorManager();
    const oldRunner = seedRunner(manager);
    mocks.prisma.monitor.findUnique.mockResolvedValue(activeMonitor);

    await manager.handleBroadcast(remoteEvent('update'));

    expect(oldRunner.stopMonitor).toHaveBeenCalledOnce();
    expect(mocks.runnerInstances).toHaveLength(2);
    expect(mocks.runnerInstances[1].startMonitor).toHaveBeenCalledOnce();
  });

  test.each(['stop', 'delete'] as const)(
    'remote %s reconciles current active database state',
    async (action) => {
      const manager = new MonitorManager();
      const oldRunner = seedRunner(manager);
      mocks.prisma.monitor.findUnique.mockResolvedValue(activeMonitor);

      await manager.handleBroadcast(remoteEvent(action));

      expect(mocks.prisma.monitor.findUnique).toHaveBeenCalledOnce();
      expect(oldRunner.stopMonitor).toHaveBeenCalledOnce();
      expect(mocks.runnerInstances[1].startMonitor).toHaveBeenCalledOnce();
      expect(manager.getRunner('monitor-a')).toBe(mocks.runnerInstances[1]);
    }
  );

  test('serializes overlapping reconciliation for one monitor', async () => {
    const manager = new MonitorManager();
    const firstLookup = deferred<typeof workspace>();
    mocks.prisma.monitor.findUnique.mockResolvedValue(activeMonitor);
    mocks.prisma.workspace.findUniqueOrThrow
      .mockReturnValueOnce(firstLookup.promise)
      .mockResolvedValueOnce(workspace);

    const first = manager.reconcile('workspace-a', 'monitor-a');
    await vi.waitFor(() => {
      expect(mocks.prisma.workspace.findUniqueOrThrow).toHaveBeenCalledTimes(1);
    });
    const second = manager.reconcile('workspace-a', 'monitor-a');

    expect(mocks.prisma.monitor.findUnique).toHaveBeenCalledTimes(1);
    firstLookup.resolve(workspace);
    await first;
    await second;

    expect(mocks.prisma.monitor.findUnique).toHaveBeenCalledTimes(2);
    expect(mocks.runnerInstances).toHaveLength(2);
    expect(mocks.runnerInstances[0].stopMonitor).toHaveBeenCalledOnce();
    expect(manager.getRunner('monitor-a')).toBe(mocks.runnerInstances[1]);
  });

  test('does not globally serialize different monitors', async () => {
    const manager = new MonitorManager();
    const workspaceALookup = deferred<typeof workspace>();
    const monitorB = {
      ...activeMonitor,
      id: 'monitor-b',
      workspaceId: 'workspace-b',
    };
    mocks.prisma.monitor.findUnique.mockImplementation(({ where }: any) =>
      Promise.resolve(where.id === 'monitor-a' ? activeMonitor : monitorB)
    );
    mocks.prisma.workspace.findUniqueOrThrow.mockImplementation(
      ({ where }: any) =>
        where.id === 'workspace-a'
          ? workspaceALookup.promise
          : Promise.resolve({ ...workspace, id: 'workspace-b' })
    );

    const first = manager.reconcile('workspace-a', 'monitor-a');
    const second = manager.reconcile('workspace-b', 'monitor-b');

    await second;
    expect(manager.getRunner('monitor-b')).toBeDefined();
    expect(manager.getRunner('monitor-a')).toBeUndefined();

    workspaceALookup.resolve(workspace);
    await first;
  });

  test('continues a monitor queue after a rejected operation', async () => {
    const manager = new MonitorManager();
    mocks.prisma.monitor.findUnique
      .mockRejectedValueOnce(new Error('lookup failed'))
      .mockResolvedValueOnce(activeMonitor);

    await expect(
      manager.reconcile('workspace-a', 'monitor-a')
    ).rejects.toThrow('lookup failed');
    await expect(
      manager.reconcile('workspace-a', 'monitor-a')
    ).resolves.toBeUndefined();

    expect(manager.getRunner('monitor-a')).toBeDefined();
  });

  test('reconcileAll starts missing active runners and removes stale runners', async () => {
    const manager = new MonitorManager();
    const staleRunner = seedRunner(manager);
    const activeB = {
      ...activeMonitor,
      id: 'monitor-b',
      workspaceId: 'workspace-b',
    };
    mocks.prisma.monitor.findMany.mockResolvedValue([
      { id: 'monitor-b', workspaceId: 'workspace-b' },
    ]);
    mocks.prisma.monitor.findUnique.mockImplementation(({ where }: any) =>
      Promise.resolve(where.id === 'monitor-b' ? activeB : null)
    );
    mocks.prisma.workspace.findUniqueOrThrow.mockResolvedValue({
      ...workspace,
      id: 'workspace-b',
    });

    await manager.reconcileAll();

    expect(staleRunner.stopMonitor).toHaveBeenCalledOnce();
    expect(manager.getRunner('monitor-a')).toBeUndefined();
    expect(manager.getRunner('monitor-b')).toBeDefined();
  });

  test('inactive reconciliation removes the runner without starting one', async () => {
    const manager = new MonitorManager();
    const oldRunner = seedRunner(manager);
    mocks.prisma.monitor.findUnique.mockResolvedValue({
      ...activeMonitor,
      active: false,
    });

    await manager.handleBroadcast(remoteEvent('start'));

    expect(oldRunner.stopMonitor).toHaveBeenCalledOnce();
    expect(mocks.runnerInstances).toHaveLength(1);
    expect(manager.getRunner('monitor-a')).toBeUndefined();
  });

  test('successful create publishes create', async () => {
    const manager = new MonitorManager();
    mocks.prisma.monitor.create.mockResolvedValue(activeMonitor);

    await manager.upsert(createInput as any);

    expect(mocks.monitorBroadcast.publish).toHaveBeenCalledWith(
      'create',
      'workspace-a',
      'monitor-a'
    );
  });

  test('successful update publishes update', async () => {
    const manager = new MonitorManager();
    mocks.prisma.monitor.update.mockResolvedValue(activeMonitor);

    await manager.upsert({ ...createInput, id: 'monitor-a' } as any);

    expect(mocks.monitorBroadcast.publish).toHaveBeenCalledWith(
      'update',
      'workspace-a',
      'monitor-a'
    );
  });

  test('successful update publishes when local runner rebuild fails', async () => {
    const manager = new MonitorManager();
    mocks.prisma.monitor.update.mockResolvedValue(activeMonitor);
    mocks.prisma.workspace.findUniqueOrThrow.mockRejectedValue(
      new Error('workspace failed')
    );

    await expect(
      manager.upsert({ ...createInput, id: 'monitor-a' } as any)
    ).rejects.toThrow('workspace failed');

    expect(mocks.monitorBroadcast.publish).toHaveBeenCalledWith(
      'update',
      'workspace-a',
      'monitor-a'
    );
  });

  test('inactive upsert does not start a runner', async () => {
    const manager = new MonitorManager();
    mocks.prisma.monitor.create.mockResolvedValue({
      ...activeMonitor,
      active: false,
    });

    await manager.upsert({ ...createInput, active: false } as any);

    expect(mocks.runnerInstances).toHaveLength(0);
    expect(mocks.monitorBroadcast.publish).toHaveBeenCalledWith(
      'create',
      'workspace-a',
      'monitor-a'
    );
  });

  test.each([
    [true, 'start'],
    [false, 'stop'],
  ] as const)('setActive maps %s to %s', async (active, action) => {
    const manager = new MonitorManager();
    seedRunner(manager);
    mocks.prisma.monitor.update.mockResolvedValue({
      ...activeMonitor,
      active,
    });

    await manager.setActive('workspace-a', 'monitor-a', active);

    expect(mocks.monitorBroadcast.publish).toHaveBeenCalledWith(
      action,
      'workspace-a',
      'monitor-a'
    );
    if (active) {
      expect(mocks.runnerInstances[0].stopMonitor).toHaveBeenCalledOnce();
      expect(mocks.runnerInstances[1].startMonitor).toHaveBeenCalledOnce();
    } else {
      expect(mocks.runnerInstances[0].stopMonitor).toHaveBeenCalledOnce();
      expect(manager.getRunner('monitor-a')).toBeUndefined();
    }
  });

  test('successful active change publishes when local runner rebuild fails', async () => {
    const manager = new MonitorManager();
    mocks.prisma.monitor.update.mockResolvedValue(activeMonitor);
    mocks.prisma.workspace.findUniqueOrThrow.mockRejectedValue(
      new Error('workspace failed')
    );

    await expect(
      manager.setActive('workspace-a', 'monitor-a', true)
    ).rejects.toThrow('workspace failed');

    expect(mocks.monitorBroadcast.publish).toHaveBeenCalledWith(
      'start',
      'workspace-a',
      'monitor-a'
    );
  });

  test('serializes active changes with remote reconciliation for one monitor', async () => {
    const manager = new MonitorManager();
    const update = deferred<typeof activeMonitor>();
    const inactiveMonitor = { ...activeMonitor, active: false };
    mocks.prisma.monitor.update.mockReturnValue(update.promise);
    mocks.prisma.monitor.findUnique.mockResolvedValue(inactiveMonitor);

    const activeChange = manager.setActive(
      'workspace-a',
      'monitor-a',
      false
    );
    await vi.waitFor(() => {
      expect(mocks.prisma.monitor.update).toHaveBeenCalledOnce();
    });

    const remoteReconciliation = manager.handleBroadcast(remoteEvent('stop'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.prisma.monitor.findUnique).not.toHaveBeenCalled();

    update.resolve(inactiveMonitor);
    await activeChange;
    await remoteReconciliation;

    expect(mocks.prisma.monitor.findUnique).toHaveBeenCalledOnce();
  });

  test('delete publishes only after successful database deletion', async () => {
    const manager = new MonitorManager();
    seedRunner(manager);
    mocks.prisma.monitor.delete.mockResolvedValue(activeMonitor);

    await manager.delete('workspace-a', 'monitor-a');

    expect(mocks.prisma.monitor.delete).toHaveBeenCalledOnce();
    expect(mocks.monitorBroadcast.publish).toHaveBeenCalledWith(
      'delete',
      'workspace-a',
      'monitor-a'
    );
  });

  test('delete succeeds when the local runner is already absent', async () => {
    const manager = new MonitorManager();
    mocks.prisma.monitor.delete.mockResolvedValue(activeMonitor);

    await expect(
      manager.delete('workspace-a', 'monitor-a')
    ).resolves.toEqual(activeMonitor);

    expect(mocks.monitorBroadcast.publish).toHaveBeenCalledWith(
      'delete',
      'workspace-a',
      'monitor-a'
    );
  });

  test('failed deletion preserves its runner and is not broadcast', async () => {
    const manager = new MonitorManager();
    const runner = seedRunner(manager);
    mocks.prisma.monitor.delete.mockRejectedValue(new Error('delete failed'));

    await expect(
      manager.delete('workspace-a', 'monitor-a')
    ).rejects.toThrow('delete failed');

    expect(runner.stopMonitor).not.toHaveBeenCalled();
    expect(manager.getRunner('monitor-a')).toBe(runner);
    expect(mocks.monitorBroadcast.publish).not.toHaveBeenCalled();
  });
});
