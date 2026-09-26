import { describe, expect, test } from 'vitest';
import { runCodeInIVM } from './index.js';

describe('sandbox memory limit', () => {
  test('reports the memory limit and keeps logs written before it', async () => {
    const result = await runCodeInIVM(`(async () => {
      console.log('before allocation');
      const items = [];
      while (true) items.push('x'.repeat(1024) + Math.random());
    })()`);

    expect(String(result.error)).toContain('memory limit');
    expect(result.logger.map((log) => log[2])).toContain('before allocation');
    expect(result.cpuTime).toBeUndefined();
    expect(result.memoryUsage).toBeUndefined();
  });
});
