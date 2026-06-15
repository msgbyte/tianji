import { existsSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { runCodeInVM2 } from './sandbox-vm2.js';

const nanoidState = vi.hoisted(() => ({
  index: 0,
  ids: [] as string[],
}));

vi.mock('nanoid', () => ({
  nanoid: () => {
    const id = `vm2-spec-${++nanoidState.index}`;
    nanoidState.ids.push(id);
    return id;
  },
}));

const require = createRequire(import.meta.url);

function getVm2Version() {
  const entry = require.resolve('vm2');
  const packageJsonPath = path.join(path.dirname(entry), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    version: string;
  };

  return packageJson.version;
}

function compareVersions(version: string, minimum: string) {
  const versionParts = version.split('.').map(Number);
  const minimumParts = minimum.split('.').map(Number);

  for (let i = 0; i < minimumParts.length; i++) {
    const versionPart = versionParts[i] ?? 0;
    const minimumPart = minimumParts[i] ?? 0;

    if (versionPart > minimumPart) {
      return 1;
    }

    if (versionPart < minimumPart) {
      return -1;
    }
  }

  return 0;
}

function getWorkerTempFilePath(id: string) {
  return path.join(os.tmpdir(), `worker-${id}.js`);
}

function expectCreatedWorkerTempFilesRemoved(previousIdCount: number) {
  const createdIds = nanoidState.ids.slice(previousIdCount);

  expect(createdIds.length).toBeGreaterThan(0);

  for (const id of createdIds) {
    expect(existsSync(getWorkerTempFilePath(id))).toBe(false);
  }
}

afterEach(() => {
  for (const id of nanoidState.ids) {
    rmSync(getWorkerTempFilePath(id), { force: true });
  }
});

describe('runCodeInVM2', () => {
  test('uses a vm2 release with the current security patches', () => {
    expect(compareVersions(getVm2Version(), '3.11.5')).toBeGreaterThanOrEqual(
      0
    );
  });

  test('executes async code and captures console output', async () => {
    const result = await runCodeInVM2(`
      (async () => {
        console.log('vm2', 42);
        console.warn('careful');
        return { ok: true, total: 1 + 2 };
      })()
    `);

    expect(result.result).toEqual({ ok: true, total: 3 });
    expect(result.logger).toHaveLength(2);
    expect(result.logger[0][0]).toBe('log');
    expect(result.logger[0][2]).toBe('vm2');
    expect(result.logger[0][3]).toBe(42);
    expect(result.logger[1][0]).toBe('warn');
    expect(result.logger[1][2]).toBe('careful');
    expect(result.usage).toBeGreaterThanOrEqual(0);
  });

  test('rejects dynamic code generation inside the sandbox', async () => {
    await expect(
      runCodeInVM2('Function("return process")()')
    ).rejects.toThrow(/code generation|eval|function/i);
  });

  test('exposes the request helper without making a real network call', async () => {
    const result = await runCodeInVM2(`
      request({
        url: 'https://example.test/resource',
        adapter: async (config) => ({
          data: { ok: true, url: config.url },
          status: 299,
          statusText: 'OK',
          headers: { 'x-test': 'yes' },
          config,
          request: {}
        })
      })
    `);

    expect(result.result).toEqual({
      data: { ok: true, url: 'https://example.test/resource' },
      headers: { 'x-test': 'yes' },
      status: 299,
    });
  });

  test('applies the configured buffer allocation limit', async () => {
    await expect(
      runCodeInVM2('Buffer.alloc(1)', 0)
    ).rejects.toThrow(/buffer|invalid|range|allocation|limit/i);
  });

  test('removes the temporary worker file after successful execution', async () => {
    const previousIdCount = nanoidState.ids.length;

    await runCodeInVM2('1 + 1');

    expectCreatedWorkerTempFilesRemoved(previousIdCount);
  });

  test('removes the temporary worker file after sandbox errors', async () => {
    const previousIdCount = nanoidState.ids.length;

    await expect(runCodeInVM2('throw new Error("boom")')).rejects.toThrow(
      'boom'
    );

    expectCreatedWorkerTempFilesRemoved(previousIdCount);
  });

  test('terminates long-running code and removes the temporary worker file', async () => {
    const previousIdCount = nanoidState.ids.length;

    await expect(
      (runCodeInVM2 as any)('while (true) {}', 16, 50)
    ).rejects.toThrow('Execution timed out');

    expectCreatedWorkerTempFilesRemoved(previousIdCount);
  });
});
