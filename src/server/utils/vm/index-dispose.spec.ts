import { afterEach, describe, expect, test, vi } from 'vitest';

const dispose = vi.fn();
const contextRelease = vi.fn();
const scriptRelease = vi.fn();
const getHeapStatistics = vi.fn(async () => ({ used_heap_size: 1234 }));
let nextRun: () => unknown | Promise<unknown> = () => 'ok';

class FakeContext {
  global = {
    setSync: vi.fn(),
    derefInto: vi.fn(() => ({})),
  };

  release = contextRelease;
}

class FakeScript {
  run = vi.fn(async () => nextRun());
  release = scriptRelease;
}

class FakeExternalCopy {
  constructor(private value: unknown) {}

  copyInto() {
    return this.value;
  }
}

class FakeCallback {
  constructor(public fn: (...args: unknown[]) => unknown) {}
}

class FakeReference {
  typeof = 'function';

  constructor(public fn: (...args: unknown[]) => unknown) {}
}

class FakeIsolate {
  cpuTime = BigInt(5678);

  createContext = vi.fn(async () => new FakeContext());
  compileScript = vi.fn(async () => new FakeScript());
  getHeapStatistics = getHeapStatistics;
  dispose = dispose;
}

vi.mock('isolated-vm', () => {
  const ivm = {
    Isolate: FakeIsolate,
    Context: FakeContext,
    Script: FakeScript,
    ExternalCopy: FakeExternalCopy,
    Callback: FakeCallback,
    Reference: FakeReference,
  };

  return {
    default: ivm,
    ...ivm,
  };
});

afterEach(() => {
  dispose.mockClear();
  contextRelease.mockClear();
  scriptRelease.mockClear();
  getHeapStatistics.mockClear();
  nextRun = () => 'ok';
  vi.resetModules();
});

describe('runCodeInIVM isolate disposal', () => {
  test('disposes isolate after successful execution', async () => {
    const { runCodeInIVM } = await import('./index.js');

    const result = await runCodeInIVM('(async () => "ok")()');

    expect(result.result).toBe('ok');
    expect(result.cpuTime).toBe(5678);
    expect(result.memoryUsage).toEqual({ used_heap_size: 1234 });
    expect(contextRelease).toHaveBeenCalledTimes(1);
    expect(scriptRelease).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  test('disposes isolate after script execution throws', async () => {
    nextRun = () => {
      throw new Error('boom');
    };
    const { runCodeInIVM } = await import('./index.js');

    const result = await runCodeInIVM('(async () => { throw new Error() })()');

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('boom');
    expect(contextRelease).toHaveBeenCalledTimes(1);
    expect(scriptRelease).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
