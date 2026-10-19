import EventEmitter from 'node:events';
import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';
import { beforeEach, describe, expect, it } from 'vitest';
import { createWorkerKVFacade } from './kv.js';

const postgresState = {
  insertedRows: [] as Array<{ key: string; value: string }>,
};

describe('Worker KV PostgreSQL key boundary', () => {
  beforeEach(() => {
    postgresState.insertedRows = [];
  });

  it('stores maximum and NUL-containing logical keys within the schema-bound physical maximum', async () => {
    const store = Object.setPrototypeOf(
      new EventEmitter(),
      KeyvPostgres.prototype
    ) as KeyvPostgres;
    store.ttlSupport = false;
    store.opts = {
      dialect: 'postgres',
      uri: 'postgresql://adapter-boundary',
      schema: 'cache',
      table: 'cache',
    };
    store.query = async (sql: string, values: unknown[] = []) => {
      if (sql.startsWith('INSERT INTO')) {
        const key = String(values[0]);
        if (key.length > 255) {
          throw new Error('value too long for type character varying(255)');
        }
        if (key.includes('\0')) {
          throw new Error('invalid byte sequence for encoding UTF8: 0x00');
        }
        postgresState.insertedRows.push({
          key,
          value: String(values[1]),
        });
      }

      return [];
    };
    const cache = new Keyv({
      store,
      namespace: 'tianji-cache',
      throwOnErrors: true,
    });
    const schemaMaximumId = 'c'.repeat(30);
    const maximumKey = 'x'.repeat(256);
    const worker = createWorkerKVFacade(
      {
        kind: 'worker',
        workspaceId: schemaMaximumId,
        workerId: schemaMaximumId,
      },
      { getCacheManager: async () => cache }
    );
    const testExecution = createWorkerKVFacade(
      {
        kind: 'test',
        workspaceId: schemaMaximumId,
        executionId: schemaMaximumId,
      },
      { getCacheManager: async () => cache }
    );

    await worker.set(maximumKey, 'private');
    await worker.workspace.set(maximumKey, 'workspace');
    await testExecution.set('nul\0key', 'test-private');
    await testExecution.workspace.set(maximumKey, 'test-workspace');

    const insertedKeys = postgresState.insertedRows.map(({ key }) => key);
    expect(insertedKeys).toHaveLength(4);
    expect(insertedKeys.every((key) => key.length < 255)).toBe(
      true
    );
    expect(Math.max(...insertedKeys.map((key) => key.length))).toBe(167);
    expect(insertedKeys.every((key) => !key.includes('\0'))).toBe(
      true
    );
    expect(
      insertedKeys.every((key) => !key.includes(maximumKey))
    ).toBe(true);
    expect(insertedKeys[0]).toMatch(/^tianji-cache:worker-kv:v1:/);
    expect(insertedKeys[1]).toMatch(/^tianji-cache:workspace-kv:v1:/);
    expect(insertedKeys[2]).toMatch(/^tianji-cache:worker-kv-test:v1:/);
    expect(insertedKeys[3]).toMatch(/^tianji-cache:worker-kv-test:v1:/);

    for (const { value } of postgresState.insertedRows) {
      expect(JSON.parse(value)).toEqual(
        expect.objectContaining({ expires: expect.any(Number) })
      );
    }

    const suffixes = insertedKeys.map(
      (key) => key.match(/[a-f0-9]{64}$/)?.[0]
    );
    expect(suffixes).toEqual([
      '2fb07a8ca0613d2936869ab0871403b73145845360a040ff78e9153c17f82bea',
      '2fb07a8ca0613d2936869ab0871403b73145845360a040ff78e9153c17f82bea',
      '19fac380a8477018726e3b1f3a1c65709f4112cc3350b0702c3b625d2f0a653b',
      '2fb07a8ca0613d2936869ab0871403b73145845360a040ff78e9153c17f82bea',
    ]);
  });
});
