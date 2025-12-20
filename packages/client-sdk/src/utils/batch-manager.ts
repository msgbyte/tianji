/**
 * Generic Batch Manager for request batching
 * Provides throttling and automatic batch sending functionality
 */

export interface BatchItem<T = any> {
  type: string;
  payload: T;
}

export interface BatchManagerOptions {
  /**
   * Batch delay in milliseconds (defaults to 200ms)
   */
  batchDelay?: number;
  /**
   * Maximum batch size before auto-flush (defaults to 100)
   */
  maxBatchSize?: number;
  /**
   * Disable batch mode and send requests immediately (defaults to false)
   */
  disableBatch?: boolean;
  /**
   * Callback to send batch request
   */
  onBatchSend: (items: BatchItem[]) => Promise<void>;
  /**
   * Callback to send single request (used when batch is disabled)
   */
  onSingleSend: (item: BatchItem) => Promise<void>;
}

export class BatchManager<T = any> {
  private queue: BatchItem<T>[] = [];
  private timer: NodeJS.Timeout | number | null = null;
  private options: BatchManagerOptions;

  constructor(options: BatchManagerOptions) {
    this.options = {
      batchDelay: 200,
      maxBatchSize: 100,
      disableBatch: false,
      ...options,
    };
  }

  /**
   * Add item to batch queue
   */
  add(type: string, payload: T): void {
    if (this.options.disableBatch) {
      // Fire and forget, but catch errors to prevent unhandled promise rejection
      this.options.onSingleSend({ type, payload }).catch((error) => {
        console.error('Error in onSingleSend:', error);
      });
      return;
    }

    this.queue.push({ type, payload });

    // Send immediately if queue reaches the limit
    if (this.queue.length >= (this.options.maxBatchSize || 100)) {
      // Fire and forget, but catch errors to prevent unhandled promise rejection
      this.flush().catch((error) => {
        console.error('Error in auto-flush:', error);
      });
      return;
    }

    // Start timer only if not already running (throttling behavior)
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.sendBatch().catch((error) => {
          console.error('Error in scheduled batch send:', error);
        });
      }, this.options.batchDelay);
    }
  }

  /**
   * Send batch request
   */
  private async sendBatch(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const requestData = [...this.queue];
    this.queue = [];
    this.timer = null;

    await this.options.onBatchSend(requestData);
  }

  /**
   * Flush batch queue manually (send all pending requests immediately)
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer as any);
      this.timer = null;
    }

    if (this.queue.length > 0) {
      await this.sendBatch();
    }
  }

  /**
   * Clear batch queue without sending
   */
  clear(): void {
    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer as any);
      this.timer = null;
    }
  }

  /**
   * Update batch manager options
   */
  updateOptions(options: Partial<BatchManagerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }
}
