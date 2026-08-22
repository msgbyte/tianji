import { describe, expect, test, vi } from 'vitest';
import { createBatchWriter } from './batchWriter.js';

describe('createBatchWriter', () => {
  test('flushes items queued while another flush is running', async () => {
    let finishFirstFlush!: () => void;
    const persist = vi
      .fn<(batch: number[]) => Promise<void>>()
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => (finishFirstFlush = resolve))
      )
      .mockResolvedValue(undefined);
    const writer = createBatchWriter({ flush: persist });

    writer.enqueue(1);
    const firstFlush = writer.flush();
    await vi.waitFor(() => expect(persist).toHaveBeenCalledWith([1]));

    writer.enqueue(2);
    const secondFlush = writer.flush();
    finishFirstFlush();
    await secondFlush;

    expect(persist).toHaveBeenNthCalledWith(2, [2]);
    await firstFlush;
    await writer.dispose();
  });
});
