import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  loadWorkerEnvironment,
  resolveWorkerEnvironment,
  syncWorkerEnvironmentVariables,
  toSafeWorkerEnvironmentVariable,
  workerEnvironmentVariablesInputSchema,
} from './environment.js';

const prismaMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock('../_client.js', () => ({
  prisma: {
    functionWorkerEnvironmentVariable: {
      findMany: prismaMocks.findMany,
    },
  },
}));

const tx = {
  functionWorkerEnvironmentVariable: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  prismaMocks.findMany.mockResolvedValue([]);
  tx.functionWorkerEnvironmentVariable.findMany.mockResolvedValue([]);
  tx.functionWorkerEnvironmentVariable.create.mockResolvedValue({});
  tx.functionWorkerEnvironmentVariable.update.mockResolvedValue({});
  tx.functionWorkerEnvironmentVariable.deleteMany.mockResolvedValue({ count: 0 });
});

describe('worker environment runtime resolution', () => {
  test('loads Text and Secret values as a plain runtime map', async () => {
    prismaMocks.findMany.mockResolvedValue([
      { key: 'API_URL', value: 'https://example.com' },
      { key: 'TOKEN', value: 'runtime-secret' },
    ]);

    await expect(loadWorkerEnvironment('worker-a')).resolves.toEqual({
      API_URL: 'https://example.com',
      TOKEN: 'runtime-secret',
    });
    expect(prismaMocks.findMany).toHaveBeenCalledWith({
      where: { workerId: 'worker-a' },
      select: { key: true, value: true },
    });
  });

  test('preserves a same-type saved Secret when its draft value is omitted', async () => {
    prismaMocks.findMany.mockResolvedValue([
      {
        id: 'env_secret',
        key: 'TOKEN',
        type: 'Secret',
        value: 'saved-secret',
      },
    ]);

    await expect(
      resolveWorkerEnvironment('worker-a', [
        { id: 'env_secret', key: 'RENAMED_TOKEN', type: 'Secret' },
      ])
    ).resolves.toEqual({ RENAMED_TOKEN: 'saved-secret' });
  });

  test('rejects a new Secret draft without a value', async () => {
    await expect(
      resolveWorkerEnvironment(undefined, [
        { key: 'TOKEN', type: 'Secret' },
      ])
    ).rejects.toThrow('A value is required for a new Secret');
  });
});

describe('worker environment variable contract', () => {
  test('returns a Text value', () => {
    expect(
      toSafeWorkerEnvironmentVariable({
        id: 'env_text',
        key: 'API_URL',
        type: 'Text',
        value: 'https://example.com',
      })
    ).toEqual({
      id: 'env_text',
      key: 'API_URL',
      type: 'Text',
      value: 'https://example.com',
    });
  });

  test('omits a Secret value from the response object', () => {
    const result = toSafeWorkerEnvironmentVariable({
      id: 'env_secret',
      key: 'API_TOKEN',
      type: 'Secret',
      value: 'do-not-return',
    });

    expect(result).toEqual({
      id: 'env_secret',
      key: 'API_TOKEN',
      type: 'Secret',
      hasValue: true,
    });
    expect(JSON.stringify(result)).not.toContain('do-not-return');
    expect(result).not.toHaveProperty('value');
  });

  test('reports an empty stored Secret as having a value', () => {
    expect(
      toSafeWorkerEnvironmentVariable({
        id: 'env_empty_secret',
        key: 'EMPTY_TOKEN',
        type: 'Secret',
        value: '',
      })
    ).toEqual({
      id: 'env_empty_secret',
      key: 'EMPTY_TOKEN',
      type: 'Secret',
      hasValue: true,
    });
  });

  test.each(['1TOKEN', 'API-TOKEN', 'API TOKEN'])('rejects invalid key %s', (key) => {
    expect(() =>
      workerEnvironmentVariablesInputSchema.parse([
        { key, type: 'Text', value: 'value' },
      ])
    ).toThrow();
  });

  test('rejects duplicate keys', () => {
    expect(() =>
      workerEnvironmentVariablesInputSchema.parse([
        { key: 'API_URL', type: 'Text', value: 'one' },
        { key: 'API_URL', type: 'Secret', value: 'two' },
      ])
    ).toThrow('Environment variable keys must be unique');
  });
});

describe('syncWorkerEnvironmentVariables', () => {
  test('preserves an existing Secret when replacement value is omitted', async () => {
    tx.functionWorkerEnvironmentVariable.findMany.mockResolvedValue([
      { id: 'env_secret', workerId: 'worker-a', key: 'TOKEN', type: 'Secret', value: 'old' },
    ]);

    await syncWorkerEnvironmentVariables(tx, 'worker-a', [
      { id: 'env_secret', key: 'TOKEN', type: 'Secret' },
    ]);

    expect(tx.functionWorkerEnvironmentVariable.update).toHaveBeenCalledWith({
      where: { id: 'env_secret', workerId: 'worker-a' },
      data: { key: 'TOKEN', type: 'Secret' },
    });
  });

  test('replaces an existing Secret without returning it', async () => {
    tx.functionWorkerEnvironmentVariable.findMany.mockResolvedValue([
      { id: 'env_secret', workerId: 'worker-a', key: 'TOKEN', type: 'Secret', value: 'old' },
    ]);

    await syncWorkerEnvironmentVariables(tx, 'worker-a', [
      { id: 'env_secret', key: 'TOKEN', type: 'Secret', value: 'new' },
    ]);

    expect(tx.functionWorkerEnvironmentVariable.update).toHaveBeenCalledWith({
      where: { id: 'env_secret', workerId: 'worker-a' },
      data: { key: 'TOKEN', type: 'Secret', value: 'new' },
    });
  });

  test('rejects a new Secret without a value', async () => {
    await expect(
      syncWorkerEnvironmentVariables(tx, 'worker-a', [
        { key: 'TOKEN', type: 'Secret' },
      ])
    ).rejects.toThrow('A value is required for a new Secret');
  });

  test('rejects a type change without a replacement value', async () => {
    tx.functionWorkerEnvironmentVariable.findMany.mockResolvedValue([
      { id: 'env_text', workerId: 'worker-a', key: 'TOKEN', type: 'Text', value: 'old' },
    ]);

    await expect(
      syncWorkerEnvironmentVariables(tx, 'worker-a', [
        { id: 'env_text', key: 'TOKEN', type: 'Secret' },
      ])
    ).rejects.toThrow('A value is required when changing variable type');
  });

  test('rejects an id that does not belong to the worker', async () => {
    await expect(
      syncWorkerEnvironmentVariables(tx, 'worker-a', [
        { id: 'env_other', key: 'TOKEN', type: 'Text', value: 'value' },
      ])
    ).rejects.toThrow('Environment variable not found');
  });

  test('deletes stored rows omitted from the submitted collection', async () => {
    tx.functionWorkerEnvironmentVariable.findMany.mockResolvedValue([
      { id: 'env_omit', workerId: 'worker-a', key: 'TOKEN', type: 'Text', value: 'old' },
    ]);

    await syncWorkerEnvironmentVariables(tx, 'worker-a', []);

    expect(tx.functionWorkerEnvironmentVariable.deleteMany).toHaveBeenCalledWith({
      where: { workerId: 'worker-a', id: { in: ['env_omit'] } },
    });
  });

  test('creates submitted variables without ids', async () => {
    await syncWorkerEnvironmentVariables(tx, 'worker-a', [
      { key: 'API_URL', type: 'Text', value: 'https://example.com' },
    ]);

    expect(tx.functionWorkerEnvironmentVariable.create).toHaveBeenCalledWith({
      data: {
        workerId: 'worker-a',
        key: 'API_URL',
        type: 'Text',
        value: 'https://example.com',
      },
    });
  });
});
