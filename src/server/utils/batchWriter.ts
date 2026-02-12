import { logger } from './logger.js';

export interface BatchWriterOptions<T> {
  /** Callback that persists a batch of items (e.g. prisma.xxx.createMany) */
  flush: (batch: T[]) => Promise<void>;
  /** Max items to buffer before forcing a flush. Default: 200 */
  maxBufferSize?: number;
  /** Interval in ms between automatic flushes. Default: 2000 */
  flushInterval?: number;
  /** Label used in log messages */
  name?: string;
}

/**
 * Generic batch writer that buffers items in memory and
 * periodically flushes them via a single bulk operation.
 *
 * This reduces the number of database connections needed
 * under high concurrency (N individual writes → 1 bulk write).
 */
export function createBatchWriter<T>(options: BatchWriterOptions<T>) {
  const {
    flush: flushFn,
    maxBufferSize = 200,
    flushInterval = 2_000,
    name = 'BatchWriter',
  } = options;

  let buffer: T[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;
  let flushing = false;

  function ensureTimer() {
    if (timer) return;
    timer = setInterval(() => void flush(), flushInterval);
    if (timer && typeof timer === 'object' && 'unref' in timer) {
      timer.unref();
    }
  }

  async function flush(): Promise<void> {
    if (buffer.length === 0 || flushing) return;

    flushing = true;
    const batch = buffer;
    buffer = [];

    try {
      await flushFn(batch);
    } catch (err) {
      logger.error(`[${name}] Failed to flush ${batch.length} items:`, err);
    } finally {
      flushing = false;
    }
  }

  function enqueue(item: T): void {
    buffer.push(item);
    ensureTimer();

    if (buffer.length >= maxBufferSize) {
      void flush();
    }
  }

  function dispose(): Promise<void> {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    return flush();
  }

  return { enqueue, flush, dispose };
}
