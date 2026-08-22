import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { runCodeInIVM } from '../../utils/vm/index.js';
import { execStoredWorker, execWorker } from './index.js';
import { env } from '../../utils/env.js';

const {
  enqueueMock,
  flushMock,
  promWorkerExecutionCounterLabelsMock,
  promWorkerExecutionCounterIncMock,
  promWorkerExecutionDurationLabelsMock,
  promWorkerExecutionDurationObserveMock,
  promWorkerCPUTimeLabelsMock,
  promWorkerCPUTimeObserveMock,
  promWorkerMemoryUsageLabelsMock,
  promWorkerMemoryUsageObserveMock,
  promWorkerRequestPayloadSizeLabelsMock,
  promWorkerRequestPayloadSizeObserveMock,
  loadWorkerEnvironmentForExecutionMock,
  loadWorkerModuleArtifactsMock,
} = vi.hoisted(() => {
  const promWorkerExecutionCounterIncMock = vi.fn();
  const promWorkerExecutionDurationObserveMock = vi.fn();
  const promWorkerCPUTimeObserveMock = vi.fn();
  const promWorkerMemoryUsageObserveMock = vi.fn();
  const promWorkerRequestPayloadSizeObserveMock = vi.fn();

  return {
    enqueueMock: vi.fn(),
    flushMock: vi.fn(),
    promWorkerExecutionCounterIncMock,
    promWorkerExecutionCounterLabelsMock: vi.fn(() => ({
      inc: promWorkerExecutionCounterIncMock,
    })),
    promWorkerExecutionDurationObserveMock,
    promWorkerExecutionDurationLabelsMock: vi.fn(() => ({
      observe: promWorkerExecutionDurationObserveMock,
    })),
    promWorkerCPUTimeObserveMock,
    promWorkerCPUTimeLabelsMock: vi.fn(() => ({
      observe: promWorkerCPUTimeObserveMock,
    })),
    promWorkerMemoryUsageObserveMock,
    promWorkerMemoryUsageLabelsMock: vi.fn(() => ({
      observe: promWorkerMemoryUsageObserveMock,
    })),
    promWorkerRequestPayloadSizeObserveMock,
    promWorkerRequestPayloadSizeLabelsMock: vi.fn(() => ({
      observe: promWorkerRequestPayloadSizeObserveMock,
    })),
    loadWorkerEnvironmentForExecutionMock: vi.fn(),
    loadWorkerModuleArtifactsMock: vi.fn(),
  };
});

vi.mock('./environment.js', () => ({
  loadWorkerEnvironmentForExecution: loadWorkerEnvironmentForExecutionMock,
}));

vi.mock('../sharedModule/bindings.js', () => ({
  loadWorkerModuleArtifacts: loadWorkerModuleArtifactsMock,
}));

vi.mock('../../utils/vm/index.js', () => ({
  runCodeInIVM: vi.fn(async () => ({
    logger: [],
    result: { ok: true },
    usage: 1,
    cpuTime: 1,
    memoryUsage: {
      used_heap_size: 1,
    },
  })),
}));

vi.mock('../../utils/batchWriter.js', () => ({
  createBatchWriter: vi.fn(() => ({
    enqueue: enqueueMock,
    flush: flushMock,
    dispose: vi.fn(),
  })),
}));

vi.mock('../../utils/prometheus/client.js', () => ({
  promWorkerExecutionCounter: {
    labels: promWorkerExecutionCounterLabelsMock,
  },
  promWorkerExecutionDuration: {
    labels: promWorkerExecutionDurationLabelsMock,
  },
  promWorkerCPUTime: {
    labels: promWorkerCPUTimeLabelsMock,
  },
  promWorkerMemoryUsage: {
    labels: promWorkerMemoryUsageLabelsMock,
  },
  promWorkerRequestPayloadSize: {
    labels: promWorkerRequestPayloadSizeLabelsMock,
  },
}));

describe('execWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.workerExecutionRequestPayloadDisabledWorkerIds = [];
    loadWorkerEnvironmentForExecutionMock.mockResolvedValue({
      environment: {},
      secretValues: [],
    });
    loadWorkerModuleArtifactsMock.mockResolvedValue([]);
  });

  test('passes request payload without embedding it into the VM source', async () => {
    const largePayload = {
      data: 'x'.repeat(50_000),
    };

    await execWorker(
      'async function fetch(params) { return { length: params.data.length }; }',
      {
        scope: {
          kind: 'worker',
          workspaceId: 'workspace-a',
          workerId: 'worker-a',
        },
        requestPayload: largePayload,
        context: { type: 'manual' },
      }
    );

    const [source, globals] = vi.mocked(runCodeInIVM).mock.calls[0];

    expect(source).not.toContain(largePayload.data);
    expect(globals).toEqual(
      expect.objectContaining({
        __requestPayload: largePayload,
      })
    );
  });

  test('passes environment variables through context.env without embedding values in source', async () => {
    await execWorker(
      'async function fetch(payload, context) { return context.env.TOKEN; }',
      {
        scope: {
          kind: 'test',
          workspaceId: 'workspace-a',
          executionId: 'environment-test',
        },
        context: { type: 'test' },
        environment: { TOKEN: 'runtime-secret' },
      }
    );

    const [source, globals] = vi.mocked(runCodeInIVM).mock.calls[0];
    expect(source).not.toContain('runtime-secret');
    expect(globals?.__workerContext).toEqual({
      type: 'test',
      env: { TOKEN: 'runtime-secret' },
    });
  });

  test('redacts Secret values from string and nested object logs', async () => {
    vi.mocked(runCodeInIVM).mockResolvedValueOnce({
      logger: [
        [
          'log',
          123,
          'token=runtime-secret',
          { token: 'runtime-secret', 'runtime-secret': true },
        ],
      ],
      result: { ok: true },
      usage: 1,
      cpuTime: 1,
      memoryUsage: { used_heap_size: 1 } as any,
    });

    const execution = await execWorker(
      'async function fetch() {}',
      {
        scope: {
          kind: 'test',
          workspaceId: 'workspace-a',
          executionId: 'redaction-test',
        },
        context: { type: 'test' },
        environment: { TOKEN: 'runtime-secret', LABEL: 'visible-text' },
        secretValues: ['runtime-secret'],
      }
    );

    expect(execution.logs).toEqual([
      ['log', 123, 'token=[secret]', { token: '[secret]', '[secret]': true }],
    ]);
    expect(JSON.stringify(execution.logs)).not.toContain('runtime-secret');
  });

  test('redacts Secret values from sandbox execution errors', async () => {
    vi.mocked(runCodeInIVM).mockResolvedValueOnce({
      logger: [],
      result: undefined,
      error: new Error('request failed with runtime-secret'),
      usage: 1,
      cpuTime: 1,
      memoryUsage: { used_heap_size: 1 } as any,
    });

    const execution = await execWorker('async function fetch() {}', {
      scope: {
        kind: 'test',
        workspaceId: 'workspace-a',
        executionId: 'error-redaction-test',
      },
      secretValues: ['runtime-secret'],
    });

    expect(execution.error).toBe('Error: request failed with [secret]');
  });

  test('redacts Secret values from runner failures', async () => {
    vi.mocked(runCodeInIVM).mockRejectedValueOnce(
      new Error('bootstrap failed with runtime-secret')
    );

    const execution = await execWorker('async function fetch() {}', {
      scope: {
        kind: 'test',
        workspaceId: 'workspace-a',
        executionId: 'runner-error-redaction-test',
      },
      secretValues: ['runtime-secret'],
    });

    expect(execution.error).toBe('Error: bootstrap failed with [secret]');
  });

  test('loads current environment on every stored execution', async () => {
    const storedWorker = {
      id: 'worker-stored',
      workspaceId: 'workspace-a',
      code: 'async function fetch(payload, context) { return context.env.TOKEN; }',
    };
    loadWorkerEnvironmentForExecutionMock
      .mockResolvedValueOnce({
        environment: { TOKEN: 'first-secret' },
        secretValues: ['first-secret'],
      })
      .mockResolvedValueOnce({
        environment: { TOKEN: 'second-secret' },
        secretValues: ['second-secret'],
      });

    await execStoredWorker(storedWorker, undefined, { type: 'manual' });
    await execStoredWorker(storedWorker, undefined, { type: 'manual' });

    expect(loadWorkerEnvironmentForExecutionMock).toHaveBeenCalledTimes(2);
    expect(loadWorkerEnvironmentForExecutionMock).toHaveBeenNthCalledWith(
      1,
      'worker-stored'
    );
    expect(loadWorkerEnvironmentForExecutionMock).toHaveBeenNthCalledWith(
      2,
      'worker-stored'
    );
    expect(
      vi.mocked(runCodeInIVM).mock.calls[0]?.[1]?.__workerContext.env
    ).toEqual({ TOKEN: 'first-secret' });
    expect(
      vi.mocked(runCodeInIVM).mock.calls[1]?.[1]?.__workerContext.env
    ).toEqual({ TOKEN: 'second-secret' });
    const storedExecutions = JSON.stringify(enqueueMock.mock.calls);
    expect(storedExecutions).not.toContain('first-secret');
    expect(storedExecutions).not.toContain('second-secret');
  });

  test('waits for HTTP execution records to flush before returning', async () => {
    let finishFlush!: () => void;
    flushMock.mockImplementationOnce(
      () => new Promise<void>((resolve) => (finishFlush = resolve))
    );

    const execution = execStoredWorker(
      {
        id: 'worker-preview',
        workspaceId: 'workspace-a',
        code: 'async function fetch() { return true; }',
      },
      undefined,
      { type: 'http' }
    );

    await vi.waitFor(() => expect(flushMock).toHaveBeenCalledOnce());
    let returned = false;
    void execution.then(() => (returned = true));
    await Promise.resolve();
    expect(returned).toBe(false);

    finishFlush();
    await execution;
  });

  test('does not persist request payload for disabled worker ids', async () => {
    const requestPayload = { secret: 'keep-out-of-db' };
    env.workerExecutionRequestPayloadDisabledWorkerIds = ['worker_disabled'];

    const execution = await execWorker(
      'async function fetch(params) { return params; }',
      {
        scope: {
          kind: 'worker',
          workspaceId: 'workspace-a',
          workerId: 'worker_disabled',
        },
        requestPayload,
        context: { type: 'manual' },
      }
    );

    const [, globals] = vi.mocked(runCodeInIVM).mock.calls[0];

    expect(globals).toEqual(
      expect.objectContaining({
        __requestPayload: requestPayload,
      })
    );
    expect(execution.requestPayload).toBeNull();
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'worker_disabled',
        requestPayload: Prisma.DbNull,
      })
    );
  });

  test('persists request payload for worker ids not in the disabled list', async () => {
    const requestPayload = { event: 'keep-in-db' };
    env.workerExecutionRequestPayloadDisabledWorkerIds = ['another_worker'];

    const execution = await execWorker(
      'async function fetch(params) { return params; }',
      {
        scope: {
          kind: 'worker',
          workspaceId: 'workspace-a',
          workerId: 'worker_enabled',
        },
        requestPayload,
        context: { type: 'manual' },
      }
    );

    expect(execution.requestPayload).toBe(requestPayload);
    expect(enqueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: 'worker_enabled',
        requestPayload,
      })
    );
  });

  test('records request payload size and histogram memory usage metrics', async () => {
    const requestPayload = { message: 'hello', nested: { count: 2 } };

    await execWorker(
      'async function fetch(params) { return params; }',
      {
        scope: {
          kind: 'worker',
          workspaceId: 'workspace-a',
          workerId: 'worker_metrics',
        },
        requestPayload,
        context: { type: 'manual' },
      }
    );

    expect(promWorkerMemoryUsageLabelsMock).toHaveBeenCalledWith(
      'worker_metrics',
      'Success'
    );
    expect(promWorkerMemoryUsageObserveMock).toHaveBeenCalledWith(1);
    expect(promWorkerRequestPayloadSizeLabelsMock).toHaveBeenCalledWith(
      'worker_metrics',
      'Success'
    );
    expect(promWorkerRequestPayloadSizeObserveMock).toHaveBeenCalledWith(
      Buffer.byteLength(JSON.stringify(requestPayload), 'utf8')
    );
  });

  test('passes KV bridges without embedding worker scope identities in the VM source', async () => {
    const workspaceId = 'workspace-source-secret';
    const workerId = 'worker-source-secret';

    await execWorker('async function fetch() { return true; }', {
      scope: { kind: 'worker', workspaceId, workerId },
      requestPayload: { event: 'manual' },
      context: { type: 'manual' },
    });

    const [source, globals] = vi.mocked(runCodeInIVM).mock.calls[0];

    expect(source).not.toContain(workspaceId);
    expect(source).not.toContain(workerId);
    expect(globals).toEqual(
      expect.objectContaining({
        __workerKV: expect.anything(),
        __workspaceKV: expect.anything(),
      })
    );
  });

  test('does not persist test scope executions and records anonymous metrics', async () => {
    await execWorker('async function fetch() { return true; }', {
      scope: {
        kind: 'test',
        workspaceId: 'workspace-a',
        executionId: 'test-a',
      },
      requestPayload: { event: 'test' },
      context: { type: 'manual' },
    });

    expect(enqueueMock).not.toHaveBeenCalled();
    expect(promWorkerExecutionCounterLabelsMock).toHaveBeenCalledWith(
      'anonymous',
      'Success'
    );
    expect(promWorkerExecutionDurationLabelsMock).toHaveBeenCalledWith(
      'anonymous',
      'Success'
    );
    expect(promWorkerCPUTimeLabelsMock).toHaveBeenCalledWith(
      'anonymous',
      'Success'
    );
    expect(promWorkerMemoryUsageLabelsMock).toHaveBeenCalledWith(
      'anonymous',
      'Success'
    );
    expect(promWorkerRequestPayloadSizeLabelsMock).toHaveBeenCalledWith(
      'anonymous',
      'Success'
    );
  });
});
