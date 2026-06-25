import { beforeEach, describe, expect, test, vi } from 'vitest';
import { runCodeInIVM } from '../../utils/vm/index.js';
import { execWorker } from './index.js';

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

describe('execWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
