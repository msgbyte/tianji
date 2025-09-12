import { logger } from './logger.js';

export interface TaskQueueOptions {
  concurrency?: number;
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string, result: any) => void;
  onTaskError?: (taskId: string, error: Error) => void;
}

export interface QueuedTask<T, R> {
  id: string;
  fn: () => Promise<R>;
  resolve: (value: R) => void;
  reject: (reason: any) => void;
  data?: T;
}

/**
 * Creates a task queue factory function that limits concurrent execution
 * @param defaultOptions Default options for the queue
 * @returns A function that can be used to queue tasks
 */
export function createTaskQueue<T = any, R = any>(
  defaultOptions: TaskQueueOptions = {}
) {
  const options = {
    concurrency: 5,
    ...defaultOptions,
  };

  const queue: QueuedTask<T, R>[] = [];
  let running = 0;
  let taskIdCounter = 0;

  /**
   * Process the next task in the queue
   */
  async function processNext(): Promise<void> {
    if (running >= options.concurrency || queue.length === 0) {
      return;
    }

    const task = queue.shift()!;
    running++;

    try {
      options.onTaskStart?.(task.id);
      logger.debug(`[TaskQueue] Starting task ${task.id}, running: ${running}`);

      const result = await task.fn();

      options.onTaskComplete?.(task.id, result);
      logger.debug(
        `[TaskQueue] Completed task ${task.id}, running: ${running - 1}`
      );

      task.resolve(result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      options.onTaskError?.(task.id, err);
      logger.error(`[TaskQueue] Error in task ${task.id}:`, err);

      task.reject(err);
    } finally {
      running--;
      // Process next task in queue
      setImmediate(() => processNext());
    }
  }

  /**
   * Add a task to the queue
   * @param taskFn The function to execute
   * @param data Optional data associated with the task
   * @returns Promise that resolves with the task result
   */
  function enqueue(taskFn: () => Promise<R>, data?: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const taskId = `task_${++taskIdCounter}`;
      const task: QueuedTask<T, R> = {
        id: taskId,
        fn: taskFn,
        resolve,
        reject,
        data,
      };

      queue.push(task);
      logger.debug(
        `[TaskQueue] Enqueued task ${taskId}, queue length: ${queue.length}`
      );

      // Try to process immediately
      setImmediate(() => processNext());
    });
  }

  /**
   * Get queue status
   */
  function getStatus() {
    return {
      queued: queue.length,
      running,
      concurrency: options.concurrency,
    };
  }

  /**
   * Clear all pending tasks in the queue
   */
  function clear() {
    while (queue.length > 0) {
      const task = queue.shift()!;
      task.reject(new Error('Task cancelled due to queue clear'));
    }
  }

  return {
    enqueue,
    getStatus,
    clear,
  };
}

/**
 * Creates a singleton task queue for a specific task type
 * This ensures that only one queue exists per task type
 */
export const taskQueues = new Map<string, any>();
export function createSingletonTaskQueue<T = any, R = any>(
  queueName: string,
  options: TaskQueueOptions = {}
) {
  if (!taskQueues.has(queueName)) {
    const queue = createTaskQueue<T, R>(options);
    taskQueues.set(queueName, queue);
    logger.info(`[TaskQueue] Created singleton queue: ${queueName}`);
  }

  return taskQueues.get(queueName);
}
