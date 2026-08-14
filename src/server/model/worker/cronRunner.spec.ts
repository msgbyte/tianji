import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cronCallback: undefined as undefined | (() => Promise<void>),
  execStoredWorker: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock('croner', () => ({
  Cron: class {
    constructor(_expression: string, callback: () => Promise<void>) {
      mocks.cronCallback = callback;
    }

    nextRun() {
      return null;
    }

    stop() {}
  },
}));

vi.mock('./index.js', () => ({
  execStoredWorker: mocks.execStoredWorker,
}));

vi.mock('../auditLog.js', () => ({
  createAuditLog: mocks.createAuditLog,
}));

vi.mock('../../cache/distributedLock.js', () => ({
  withDistributedLock: vi.fn(
    async (_name: string, callback: () => Promise<unknown>) => callback()
  ),
}));

vi.mock('../../cache/index.js', () => ({
  getCacheManager: vi.fn(async () => ({
    get: vi.fn(async () => null),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock('../../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('WorkerCronRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cronCallback = undefined;
    mocks.execStoredWorker.mockResolvedValue({ status: 'Success' });
  });

  test('delegates Cron execution to stored-worker execution with Cron context', async () => {
    const { WorkerCronRunner } = await import('./cronRunner.js');
    const workspace = { id: 'workspace-a', settings: {} } as any;
    const worker = {
      id: 'worker-a',
      workspaceId: 'workspace-a',
      name: 'Cron Worker',
      code: 'async function fetch() { return true; }',
      active: true,
      enableCron: true,
      cronExpression: '* * * * *',
    } as any;
    const runner = new WorkerCronRunner(workspace, worker);

    await runner.startCron();
    await mocks.cronCallback?.();

    expect(mocks.execStoredWorker).toHaveBeenCalledWith(worker, undefined, {
      type: 'cron',
    });
  });
});
