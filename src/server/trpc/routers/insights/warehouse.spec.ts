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
    upsertWarehouseTable: vi.fn(async () => ({
      created: 0,
      updated: 0,
      deleted: 0,
    })),
    prisma: {
      warehouseDatabase: {
        findUnique: vi.fn(),
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
  getWarehouseConnection: vi.fn(),
  getMysqlFieldType: vi.fn(),
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
    mocks.prisma.warehouseDatabase.findUnique.mockResolvedValue(
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
    mocks.prisma.warehouseDatabase.findUnique.mockResolvedValue(
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
