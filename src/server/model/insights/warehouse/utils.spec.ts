import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const mysqlPools: any[] = [];
  const pgPools: any[] = [];

  const createMysqlPool = vi.fn((url: string) => {
    const pool = {
      url,
      end: vi.fn(async () => {}),
      query: vi.fn(),
    };
    mysqlPools.push(pool);
    return pool;
  });

  class PgPool {
    end = vi.fn(async () => {});
    query = vi.fn();

    constructor(public config: any) {
      pgPools.push(this);
    }
  }

  class PgClient {
    connect = vi.fn();
    query = vi.fn();
    end = vi.fn();
  }

  return {
    mysqlPools,
    pgPools,
    createMysqlPool,
    PgPool,
    PgClient,
  };
});

vi.mock('mysql2/promise', () => ({
  createPool: mocks.createMysqlPool,
  createConnection: vi.fn(),
}));

vi.mock('pg', () => ({
  default: {
    Pool: mocks.PgPool,
    Client: mocks.PgClient,
  },
  Pool: mocks.PgPool,
  Client: mocks.PgClient,
}));

vi.mock('../../_client.js', () => ({
  prisma: {},
}));

vi.mock('../../workspace/config.js', () => ({
  getWorkspaceConfig: vi.fn(),
}));

vi.mock('../../../utils/env.js', () => ({
  env: {
    insights: {
      warehouse: {
        url: undefined,
        applicationsJson: undefined,
      },
    },
  },
}));

async function importUtils() {
  vi.resetModules();
  return (await import('./utils.js')) as any;
}

function mockMysqlTables(pool: any, tableName: string, ddl: string) {
  pool.query
    .mockResolvedValueOnce([
      [{ Tables_in_db: tableName }],
      [{ name: 'Tables_in_db' }],
    ])
    .mockResolvedValueOnce([[{ Table: tableName, 'Create Table': ddl }], []]);
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.mysqlPools.length = 0;
  mocks.pgPools.length = 0;
});

describe('warehouse connection lifecycle', () => {
  test('closes and removes a cached mysql pool for a URL', async () => {
    const utils = await importUtils();
    const url = 'mysql://user:pass@localhost:3306/db';

    const first = utils.getWarehouseConnection(url, 'mysql');
    const second = utils.getWarehouseConnection(url, 'mysql');
    expect(second.pool).toBe(first.pool);

    await utils.disposeWarehouseConnection(url);

    expect(first.pool.end).toHaveBeenCalledTimes(1);
    const third = utils.getWarehouseConnection(url, 'mysql');
    expect(third.pool).not.toBe(first.pool);
  });

  test('closes and removes a cached postgresql pool for a URL', async () => {
    const utils = await importUtils();
    const url = 'postgresql://user:pass@localhost:5432/db?schema=analytics';

    const first = utils.getWarehouseConnection(url, 'postgresql');
    const second = utils.getWarehouseConnection(url, 'postgresql');
    expect(second.pool).toBe(first.pool);

    await utils.disposeWarehouseConnection(url);

    expect(first.pool.end).toHaveBeenCalledTimes(1);
    const third = utils.getWarehouseConnection(url, 'postgresql');
    expect(third.pool).not.toBe(first.pool);
  });

  test('clears cached table metadata for one URL', async () => {
    const utils = await importUtils();
    const url = 'mysql://user:pass@localhost:3306/db';
    const pool = utils.getWarehouseConnection(url, 'mysql').pool;
    mockMysqlTables(pool, 'events', 'CREATE TABLE events');

    await expect(utils.getWarehouseTables(url, 'mysql')).resolves.toEqual([
      { tableName: 'events', ddl: 'CREATE TABLE events' },
    ]);
    await utils.getWarehouseTables(url, 'mysql');
    expect(pool.query).toHaveBeenCalledTimes(2);

    utils.clearWarehouseTablesCache(url);
    mockMysqlTables(pool, 'events_v2', 'CREATE TABLE events_v2');

    await expect(utils.getWarehouseTables(url, 'mysql')).resolves.toEqual([
      { tableName: 'events_v2', ddl: 'CREATE TABLE events_v2' },
    ]);
    expect(pool.query).toHaveBeenCalledTimes(4);
  });

  test('disposing a URL also clears its cached table metadata', async () => {
    const utils = await importUtils();
    const url = 'mysql://user:pass@localhost:3306/db';
    const firstPool = utils.getWarehouseConnection(url, 'mysql').pool;
    mockMysqlTables(firstPool, 'events', 'CREATE TABLE events');

    await utils.getWarehouseTables(url, 'mysql');
    await utils.disposeWarehouseConnection(url);

    const secondPool = utils.getWarehouseConnection(url, 'mysql').pool;
    mockMysqlTables(secondPool, 'events_v2', 'CREATE TABLE events_v2');

    await expect(utils.getWarehouseTables(url, 'mysql')).resolves.toEqual([
      { tableName: 'events_v2', ddl: 'CREATE TABLE events_v2' },
    ]);
    expect(firstPool.end).toHaveBeenCalledTimes(1);
    expect(secondPool).not.toBe(firstPool);
  });
});
