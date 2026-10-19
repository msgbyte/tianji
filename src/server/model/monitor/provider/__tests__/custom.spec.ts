import { afterEach, describe, expect, test, vi } from 'vitest';

const originalUseVM2 = process.env.USE_VM2;

function createMonitor(payload: unknown) {
  return {
    id: '',
    workspaceId: '',
    name: '',
    type: 'custom',
    active: true,
    interval: 0,
    maxRetries: 0,
    trendingMode: false,
    recentError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    payload,
    upMessageTemplate: '',
    downMessageTemplate: '',
  } as any;
}

async function importCustomProviderWithUseVM2(useVM2: boolean) {
  vi.resetModules();

  if (useVM2) {
    process.env.USE_VM2 = 'true';
  } else {
    delete process.env.USE_VM2;
  }

  return import('../custom.js');
}

afterEach(() => {
  vi.resetModules();

  if (originalUseVM2 === undefined) {
    delete process.env.USE_VM2;
  } else {
    process.env.USE_VM2 = originalUseVM2;
  }
});

describe('custom monitor provider', () => {
  test('throws when payload is not an object', async () => {
    const { custom } = await importCustomProviderWithUseVM2(false);

    await expect(custom.run(createMonitor('return 1;'))).rejects.toThrow(
      'monitor.payload should be object'
    );
  });

  test('returns numeric results from custom code using isolated-vm', async () => {
    const { custom } = await importCustomProviderWithUseVM2(false);

    await expect(
      custom.run(createMonitor({ code: 'return 32 + 10;' }))
    ).resolves.toBe(42);
  });

  test('returns -1 for non-numeric custom code results', async () => {
    const { custom } = await importCustomProviderWithUseVM2(false);

    await expect(
      custom.run(createMonitor({ code: 'return "not a number";' }))
    ).resolves.toBe(-1);
  });

  test('executes custom code through VM2 when USE_VM2 is enabled', async () => {
    const { custom } = await importCustomProviderWithUseVM2(true);

    await expect(
      custom.run(createMonitor({ code: 'return 20 + 22;' }))
    ).resolves.toBe(42);
  });
});
