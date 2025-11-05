import { describe, test, expect } from 'vitest';
import { runCodeInIVM } from './index.js';

describe('runCodeInIVM', () => {
  test('should execute simple code and return result', async () => {
    const code = '(async () => { return 1 + 1; })()';
    const result = await runCodeInIVM(code);

    expect(result.result).toBe(2);
    expect(result.error).toBeUndefined();
    expect(result.usage).toBeGreaterThan(0);
  });

  test('should handle console.log calls', async () => {
    const code = `
      (async () => {
        console.log('Hello');
        console.log('World');
        return 'done';
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.logger).toHaveLength(2);
    expect(result.logger[0][0]).toBe('log');
    expect(result.logger[0][2]).toBe('Hello');
    expect(result.logger[1][0]).toBe('log');
    expect(result.logger[1][2]).toBe('World');
    expect(result.result).toBe('done');
  });

  test('should handle console.warn and console.error', async () => {
    const code = `
      (async () => {
        console.warn('Warning message');
        console.error('Error message');
        return true;
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.logger).toHaveLength(2);
    expect(result.logger[0][0]).toBe('warn');
    expect(result.logger[0][2]).toBe('Warning message');
    expect(result.logger[1][0]).toBe('error');
    expect(result.logger[1][2]).toBe('Error message');
    expect(result.result).toBe(true);
  });

  test('should handle async code execution', async () => {
    const code = `
      (async () => {
        const result = await Promise.resolve(42);
        return result * 2;
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.result).toBe(84);
    expect(result.error).toBeUndefined();
  });

  test('should catch and return errors', async () => {
    const code = `
      (async () => {
        throw new Error('Test error');
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.result).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('Test error');
  });

  test('should handle variables and operations', async () => {
    const code = `
      (async () => {
        const a = 10;
        const b = 20;
        const sum = a + b;
        return sum;
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.result).toBe(30);
  });

  test('should handle string operations', async () => {
    const code = `
      (async () => {
        const greeting = 'Hello';
        const name = 'World';
        return greeting + ' ' + name;
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.result).toBe('Hello World');
  });

  test('should handle array operations', async () => {
    const code = `
      (async () => {
        const numbers = [1, 2, 3, 4, 5];
        const doubled = numbers.map(n => n * 2);
        return doubled;
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.result).toEqual([2, 4, 6, 8, 10]);
  });

  test('should handle object operations', async () => {
    const code = `
      (async () => {
        const person = {
          name: 'John',
          age: 30
        };
        return person;
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.result).toEqual({
      name: 'John',
      age: 30,
    });
  });

  test('should properly cleanup isolate', async () => {
    const code = '(async () => { return "cleanup test"; })()';
    const result = await runCodeInIVM(code);

    expect(result.isolate).toBeDefined();
    expect(result.result).toBe('cleanup test');

    // Check that isolate is marked for disposal
    result.isolate.dispose();
  });

  test('should track execution time', async () => {
    const code = `
      (async () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.usage).toBeGreaterThanOrEqual(0);
    expect(result.result).toBe(499500); // sum of 0 to 999
  });

  test('should handle empty return', async () => {
    const code = `
      (async () => {
        console.log('No explicit return');
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.result).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  test('should handle multiple console calls with different types', async () => {
    const code = `
      (async () => {
        console.log('string', 123, true, { key: 'value' });
        return 'complete';
      })()
    `;
    const result = await runCodeInIVM(code);

    expect(result.logger[0][0]).toBe('log');
    expect(result.logger[0][2]).toBe('string');
    expect(result.logger[0][3]).toBe(123);
    expect(result.logger[0][4]).toBe(true);
    expect(result.logger[0][5]).toEqual({ key: 'value' });
    expect(result.result).toBe('complete');
  });
});
