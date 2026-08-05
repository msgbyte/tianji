import { createId } from '@paralleldrive/cuid2';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const endRequest = vi.fn();

  return {
    endRequest,
    jwtVerify: vi.fn(() => ({
      id: 'user-id',
      username: 'user',
      role: 'user',
    })),
    getWorkspaceUser: vi.fn(async () => ({ role: 'owner' })),
    promStartTimer: vi.fn(() => endRequest),
    pingWarehouse: vi.fn(async () => true),
    disposeWarehouseConnection: vi.fn(async () => {}),
    clearWarehouseTablesCache: vi.fn(),
    getWarehouseConnection: vi.fn(),
    upsertWarehouseTable: vi.fn(async () => ({
      created: 0,
      updated: 0,
      deleted: 0,
    })),
    prisma: {
      warehouseDatabase: {
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      warehouseDatabaseTable: {
        update: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

vi.mock('../../../middleware/auth.js', () => ({
  jwtVerify: mocks.jwtVerify,
}));

vi.mock('../../../model/auth.js', () => ({
  authConfig: {},
}));

vi.mock('../../../model/user.js', () => ({
  verifyUserApiKey: vi.fn(),
}));

vi.mock('../../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
}));

vi.mock('../../../utils/prometheus/client.js', () => ({
  promTrpcRequest: {
    startTimer: mocks.promStartTimer,
  },
}));

vi.mock('../../../model/_client.js', () => ({
  prisma: mocks.prisma,
}));

vi.mock('../../../model/insights/warehouse/connections.js', () => ({
  upsertWarehouseTable: mocks.upsertWarehouseTable,
}));

vi.mock('../../../model/insights/warehouse/utils.js', () => ({
  pingWarehouse: mocks.pingWarehouse,
  disposeWarehouseConnection: mocks.disposeWarehouseConnection,
  clearWarehouseTablesCache: mocks.clearWarehouseTablesCache,
  getWarehouseConnection: mocks.getWarehouseConnection,
  getMysqlFieldType: vi.fn(() => 'varchar'),
  getPostgresqlFieldType: vi.fn(),
  extractSchemaFromUrl: vi.fn(() => 'public'),
}));

function database(overrides: Partial<any> = {}) {
  return {
    id: 'database-id',
    workspaceId: createId(),
    name: 'Warehouse',
    description: '',
    connectionUri: 'mysql://new',
    dbDriver: 'mysql',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function databaseTable(overrides: Partial<any> = {}) {
  return {
    id: 'table-id',
    workspaceId: createId(),
    databaseId: 'database-id',
    name: 'customers',
    description: '',
    ddl: '',
    prompt: '',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function matchesTenant(where: any, item: { id: string; workspaceId: string }) {
  return (
    where.id === item.id &&
    (where.workspaceId === undefined || where.workspaceId === item.workspaceId)
  );
}

async function createCaller() {
  const { warehouseRouter } = await import('./warehouse.js');

  return warehouseRouter.createCaller({
    token: 'jwt-token',
    timezone: 'utc',
    language: 'en',
    req: {} as any,
    origin: '',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetModules();
});

describe('warehouse database router lifecycle', () => {
  test('disposes the previous connection when updating to a new connection URI', async () => {
    const workspaceId = createId();
    const oldUri = 'mysql://old';
    const newUri = 'mysql://new';
    mocks.prisma.warehouseDatabase.findFirst.mockResolvedValue(
      database({ workspaceId, connectionUri: oldUri })
    );
    mocks.prisma.warehouseDatabase.update.mockResolvedValue(
      database({ workspaceId, connectionUri: newUri })
    );
    const caller = await createCaller();

    await caller.database.upsert({
      workspaceId,
      id: 'database-id',
      name: 'Warehouse',
      connectionUri: newUri,
      dbDriver: 'mysql',
    });

    expect(mocks.pingWarehouse).toHaveBeenCalledWith(newUri, 'mysql');
    expect(mocks.disposeWarehouseConnection).toHaveBeenCalledWith(oldUri);
    expect(mocks.clearWarehouseTablesCache).toHaveBeenCalledWith(newUri);
    expect(mocks.upsertWarehouseTable).toHaveBeenCalledWith(
      'database-id',
      newUri
    );
  });

  test('does not dispose the current connection when updating metadata only', async () => {
    const workspaceId = createId();
    const oldUri = 'mysql://old';
    mocks.prisma.warehouseDatabase.findFirst.mockResolvedValue(
      database({ workspaceId, connectionUri: oldUri })
    );
    mocks.prisma.warehouseDatabase.update.mockResolvedValue(
      database({ workspaceId, connectionUri: oldUri, name: 'Renamed' })
    );
    const caller = await createCaller();

    await caller.database.upsert({
      workspaceId,
      id: 'database-id',
      name: 'Renamed',
      description: '',
    });

    expect(mocks.disposeWarehouseConnection).not.toHaveBeenCalled();
    expect(mocks.clearWarehouseTablesCache).not.toHaveBeenCalled();
    expect(mocks.upsertWarehouseTable).not.toHaveBeenCalled();
  });

  test('disposes the deleted database connection URI', async () => {
    const workspaceId = createId();
    const oldUri = 'mysql://old';
    mocks.prisma.warehouseDatabase.delete.mockResolvedValue(
      database({ workspaceId, connectionUri: oldUri })
    );
    const caller = await createCaller();

    await caller.database.delete({
      workspaceId,
      id: 'database-id',
    });

    expect(mocks.disposeWarehouseConnection).toHaveBeenCalledWith(oldUri);
  });
});

describe('warehouse database authorization', () => {
  test('syncs a database that belongs to the current workspace', async () => {
    const workspaceId = createId();
    const currentDatabase = database({ workspaceId });
    mocks.prisma.warehouseDatabase.findFirst.mockImplementation(
      async ({ where }: any) =>
        matchesTenant(where, currentDatabase) ? currentDatabase : null
    );
    const caller = await createCaller();

    const result = await caller.database.sync({
      workspaceId,
      id: currentDatabase.id,
    });

    expect(result).toEqual({ created: 0, updated: 0, deleted: 0 });
  });

  test('rejects syncing a database that belongs to another workspace', async () => {
    const attackerWorkspaceId = createId();
    const victimDatabase = database({ workspaceId: createId() });
    mocks.prisma.warehouseDatabase.findFirst.mockImplementation(
      async ({ where }: any) =>
        matchesTenant(where, victimDatabase) ? victimDatabase : null
    );
    const caller = await createCaller();

    await expect(
      caller.database.sync({
        workspaceId: attackerWorkspaceId,
        id: victimDatabase.id,
      })
    ).rejects.toThrow('Warehouse database not found');
  });

  test('rejects updating another workspace database before pinging its new URI', async () => {
    const attackerWorkspaceId = createId();
    const victimDatabase = database({ workspaceId: createId() });
    mocks.prisma.warehouseDatabase.findFirst.mockImplementation(
      async ({ where }: any) =>
        matchesTenant(where, victimDatabase) ? victimDatabase : null
    );
    mocks.prisma.warehouseDatabase.update.mockResolvedValue(victimDatabase);
    const caller = await createCaller();

    await expect(
      caller.database.upsert({
        workspaceId: attackerWorkspaceId,
        id: victimDatabase.id,
        name: 'Hijacked',
        connectionUri: 'mysql://attacker-controlled',
      })
    ).rejects.toThrow('Warehouse database not found');
    expect(mocks.pingWarehouse).not.toHaveBeenCalled();
  });

  test('rejects deleting a database that belongs to another workspace', async () => {
    const attackerWorkspaceId = createId();
    const victimDatabase = database({ workspaceId: createId() });
    mocks.prisma.warehouseDatabase.delete.mockImplementation(
      async ({ where }: any) => {
        if (matchesTenant(where, victimDatabase)) {
          return victimDatabase;
        }
        throw new Error('Record not found');
      }
    );
    const caller = await createCaller();

    await expect(
      caller.database.delete({
        workspaceId: attackerWorkspaceId,
        id: victimDatabase.id,
      })
    ).rejects.toThrow('Record not found');
  });
});

describe('warehouse table authorization', () => {
  test('updates a table that belongs to the current workspace', async () => {
    const workspaceId = createId();
    const currentTable = databaseTable({ workspaceId });
    const updatedTable = databaseTable({
      workspaceId,
      name: 'renamed_customers',
    });
    mocks.prisma.warehouseDatabaseTable.update.mockImplementation(
      async ({ where }: any) => {
        if (matchesTenant(where, currentTable)) {
          return updatedTable;
        }
        throw new Error('Record not found');
      }
    );
    const caller = await createCaller();

    const result = await caller.table.upsert({
      workspaceId,
      id: currentTable.id,
      databaseId: currentTable.databaseId,
      name: updatedTable.name,
    });

    expect(result).toEqual(updatedTable);
  });

  test('deletes a table that belongs to the current workspace', async () => {
    const workspaceId = createId();
    const currentTable = databaseTable({ workspaceId });
    mocks.prisma.warehouseDatabaseTable.delete.mockImplementation(
      async ({ where }: any) => {
        if (matchesTenant(where, currentTable)) {
          return currentTable;
        }
        throw new Error('Record not found');
      }
    );
    const caller = await createCaller();

    const result = await caller.table.delete({
      workspaceId,
      id: currentTable.id,
    });

    expect(result).toEqual(currentTable);
  });

  test('rejects creating a table for another workspace database', async () => {
    const attackerWorkspaceId = createId();
    const victimDatabase = database({ workspaceId: createId() });
    const newTable = databaseTable({
      workspaceId: attackerWorkspaceId,
      databaseId: victimDatabase.id,
    });
    mocks.prisma.warehouseDatabase.findFirst.mockImplementation(
      async ({ where }: any) =>
        matchesTenant(where, victimDatabase) ? victimDatabase : null
    );
    mocks.prisma.warehouseDatabaseTable.create.mockResolvedValue(newTable);
    const caller = await createCaller();

    await expect(
      caller.table.upsert({
        workspaceId: attackerWorkspaceId,
        databaseId: victimDatabase.id,
        name: newTable.name,
      })
    ).rejects.toThrow('Warehouse database not found');
  });

  test('rejects updating a table that belongs to another workspace', async () => {
    const attackerWorkspaceId = createId();
    const victimTable = databaseTable({ workspaceId: createId() });
    mocks.prisma.warehouseDatabaseTable.update.mockImplementation(
      async ({ where }: any) => {
        if (matchesTenant(where, victimTable)) {
          return victimTable;
        }
        throw new Error('Record not found');
      }
    );
    const caller = await createCaller();

    await expect(
      caller.table.upsert({
        workspaceId: attackerWorkspaceId,
        id: victimTable.id,
        databaseId: victimTable.databaseId,
        name: 'Hijacked',
      })
    ).rejects.toThrow('Record not found');
  });

  test('rejects deleting a table that belongs to another workspace', async () => {
    const attackerWorkspaceId = createId();
    const victimTable = databaseTable({ workspaceId: createId() });
    mocks.prisma.warehouseDatabaseTable.delete.mockImplementation(
      async ({ where }: any) => {
        if (matchesTenant(where, victimTable)) {
          return victimTable;
        }
        throw new Error('Record not found');
      }
    );
    const caller = await createCaller();

    await expect(
      caller.table.delete({
        workspaceId: attackerWorkspaceId,
        id: victimTable.id,
      })
    ).rejects.toThrow('Record not found');
  });
});

describe('warehouse query authorization', () => {
  test('rejects a database that belongs to another workspace', async () => {
    const attackerWorkspaceId = createId();
    const victimWorkspaceId = createId();
    const victimDatabase = database({ workspaceId: victimWorkspaceId });
    mocks.prisma.warehouseDatabase.findFirst.mockImplementation(
      async ({ where }: any) =>
        matchesTenant(where, victimDatabase) ? victimDatabase : null
    );
    mocks.getWarehouseConnection.mockReturnValue({
      driver: 'mysql',
      pool: {
        query: vi.fn(async () => [
          [{ secret: 'victim-data' }],
          [{ name: 'secret', type: 253 }],
        ]),
      },
    });
    const caller = await createCaller();

    await expect(
      caller.query.execute({
        workspaceId: attackerWorkspaceId,
        databaseId: victimDatabase.id,
        sql: 'SELECT secret FROM customers',
      })
    ).rejects.toThrow('Database connection not found');
  });

  test('executes a query against a database in the current workspace', async () => {
    const workspaceId = createId();
    const currentDatabase = database({ workspaceId });
    mocks.prisma.warehouseDatabase.findFirst.mockImplementation(
      async ({ where }: any) =>
        matchesTenant(where, currentDatabase) ? currentDatabase : null
    );
    mocks.getWarehouseConnection.mockReturnValue({
      driver: 'mysql',
      pool: {
        query: vi.fn(async () => [
          [{ name: 'Alice' }],
          [{ name: 'name', type: 253 }],
        ]),
      },
    });
    const caller = await createCaller();

    const result = await caller.query.execute({
      workspaceId,
      databaseId: currentDatabase.id,
      sql: 'SELECT name FROM customers',
    });

    expect(result.rows).toEqual([{ name: 'Alice' }]);
  });
});
