import { describe, test, expect } from 'vitest';
import { createTaskQueue } from './taskQueue.js';

describe('TaskQueue', () => {
  describe('createTaskQueue', () => {
    test('should execute tasks with concurrency limit', async () => {
      const concurrency = 2;
      const queue = createTaskQueue({ concurrency });

      let runningCount = 0;
      let maxConcurrent = 0;

      const createTask = (id: number) => async () => {
        runningCount++;
        maxConcurrent = Math.max(maxConcurrent, runningCount);

        // Simulate async work
        await new Promise((resolve) => setTimeout(resolve, 500));

        runningCount--;
        return `task-${id}`;
      };

      // Start 5 tasks simultaneously
      const tasks = Array.from({ length: 5 }, (_, i) =>
        queue.enqueue(createTask(i))
      );

      const results = await Promise.all(tasks);

      expect(results).toHaveLength(5);
      expect(results).toEqual([
        'task-0',
        'task-1',
        'task-2',
        'task-3',
        'task-4',
      ]);
      expect(maxConcurrent).toBeLessThanOrEqual(concurrency);
      expect(runningCount).toBe(0); // All tasks should be completed
    });
  });
});
