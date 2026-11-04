import { afterEach, describe, expect, it, vi } from 'vitest';
import { BatchManager } from './batch-manager';

describe('BatchManager', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the default batch delay when options are explicitly undefined', async () => {
    vi.useFakeTimers();
    const onBatchSend = vi.fn().mockResolvedValue(undefined);
    const manager = new BatchManager({
      batchDelay: undefined,
      disableBatch: undefined,
      onBatchSend,
      onSingleSend: vi.fn().mockResolvedValue(undefined),
    });

    manager.add('event', { name: 'a' });
    manager.add('event', { name: 'b' });

    await vi.advanceTimersByTimeAsync(199);
    expect(onBatchSend).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onBatchSend).toHaveBeenCalledTimes(1);
    expect(onBatchSend.mock.calls[0][0]).toHaveLength(2);
  });

  it('keeps the default batch delay when updateOptions receives undefined', async () => {
    vi.useFakeTimers();
    const onBatchSend = vi.fn().mockResolvedValue(undefined);
    const manager = new BatchManager({
      onBatchSend,
      onSingleSend: vi.fn().mockResolvedValue(undefined),
    });

    manager.updateOptions({ batchDelay: undefined });
    manager.add('event', { name: 'a' });

    await vi.advanceTimersByTimeAsync(199);
    expect(onBatchSend).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onBatchSend).toHaveBeenCalledTimes(1);
  });
});
