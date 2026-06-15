import { afterEach, describe, expect, test, vi } from 'vitest';

const originalUseVM2 = process.env.USE_VM2;

async function importRunnerWithUseVM2(useVM2: boolean) {
  vi.resetModules();

  if (useVM2) {
    process.env.USE_VM2 = 'true';
  } else {
    delete process.env.USE_VM2;
  }

  return import('./index.js');
}

afterEach(() => {
  vi.resetModules();

  if (originalUseVM2 === undefined) {
    delete process.env.USE_VM2;
  } else {
    process.env.USE_VM2 = originalUseVM2;
  }
});

describe('runCodeInVM', () => {
  test('uses isolated-vm by default', async () => {
    const { runCodeInVM } = await importRunnerWithUseVM2(false);
    const result = await runCodeInVM('console.log("ivm route"); return 12;');

    expect(result.result).toBe(12);
    expect(result.logger[0][0]).toBe('log');
    expect(result.logger[0][2]).toBe('ivm route');
    expect(result).toHaveProperty('isolate');
  });

  test('uses VM2 when USE_VM2 is enabled', async () => {
    const { runCodeInVM } = await importRunnerWithUseVM2(true);
    const result = await runCodeInVM('console.log("vm2 route"); return 24;');

    expect(result.result).toBe(24);
    expect(result.logger[0][0]).toBe('log');
    expect(result.logger[0][2]).toBe('vm2 route');
    expect(result).not.toHaveProperty('isolate');
  });
});
