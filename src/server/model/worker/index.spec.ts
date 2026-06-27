import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { runCodeInIVM } from '../../utils/vm/index.js';
import { execWorker } from './index.js';
import { env } from '../../utils/env.js';

const {
  enqueueMock,
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
} = vi.hoisted(() => {
  const promWorkerExecutionCounterIncMock = vi.fn();
  const promWorkerExecutionDurationObserveMock = vi.fn();
  const promWorkerCPUTimeObserveMock = vi.fn();
  const promWorkerMemoryUsageObserveMock = vi.fn();
  const promWorkerRequestPayloadSizeObserveMock = vi.fn();

  return {
    enqueueMock: vi.fn(),
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
  };
});

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
    flush: vi.fn(),
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
  });

  test('passes request payload without embedding it into the VM source', async () => {
    const largePayload = {
      data: 'x'.repeat(50_000),
    };

    await execWorker(
      'async function fetch(params) { return { length: params.data.length }; }',
      undefined,
      largePayload
    );

    const [source, globals] = vi.mocked(runCodeInIVM).mock.calls[0];

    expect(source).not.toContain(largePayload.data);
    expect(source.length).toBeLessThan(5_000);
    expect(globals).toEqual(
      expect.objectContaining({
        __requestPayload: largePayload,
      })
    );
  });

  test('does not persist request payload for disabled worker ids', async () => {
    const requestPayload = { secret: 'keep-out-of-db' };
    env.workerExecutionRequestPayloadDisabledWorkerIds = ['worker_disabled'];

    const execution = await execWorker(
      'async function fetch(params) { return params; }',
      'worker_disabled',
      requestPayload
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
      'worker_enabled',
      requestPayload
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
      'worker_metrics',
      requestPayload
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
});
