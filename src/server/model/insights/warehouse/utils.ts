import { z } from 'zod';
import { createPool, Pool, createConnection } from 'mysql2/promise';
import { env } from '../../../utils/env.js';
import { WarehouseDatabaseTable } from '@prisma/client';
import { flatten, get, uniqBy } from 'lodash-es';
import { prisma } from '../../_client.js';
import {
  warehouseInsightsApplicationSchema,
  warehouseLongTableInsightsApplicationSchema,
  warehouseWideTableInsightsApplicationSchema,
} from '@tianji/shared';
import { getWorkspaceConfig } from '../../workspace/config.js';
import { INIT_WORKSPACE_ID } from '../../../utils/const.js';

export interface WarehouseTableMeta {
  tableName: string;
  ddl: string;
}

// MySQL date formats for different time units
export const MYSQL_DATE_FORMATS = {
  minute: '%Y-%m-%d %H:%i:00',
  hour: '%Y-%m-%d %H:00:00',
  day: '%Y-%m-%d',
  month: '%Y-%m-01',
  year: '%Y-01-01',
} as const;

export const dateTypeSchema = z.enum([
  'timestamp', // for example: 1739203200
  'timestampMs', // for example: 1739203200000
  'date', // for example: 2025-08-01
  'datetime', // for example: 2025-08-01 00:00:00
]);

export type WarehouseInsightsApplication = z.infer<
  typeof warehouseInsightsApplicationSchema
>;

export type WarehouseLongTableInsightsApplication = z.infer<
  typeof warehouseLongTableInsightsApplicationSchema
>;

export type WarehouseWideTableInsightsApplication = z.infer<
  typeof warehouseWideTableInsightsApplicationSchema
>;

// Cache for warehouse applications to reduce repeated database queries
const warehouseApplicationsCache = new Map<
  string,
  {
    applications: WarehouseInsightsApplication[];
    timestamp: number;
  }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getWarehouseApplications(
  workspaceId: string
): Promise<WarehouseInsightsApplication[]> {
  // Check cache first
  const cached = warehouseApplicationsCache.get(workspaceId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.applications;
  }

  let applications: WarehouseInsightsApplication[];

  if (
    workspaceId === INIT_WORKSPACE_ID &&
    env.insights.warehouse.applicationsJson
  ) {
    applications = warehouseInsightsApplicationSchema
      .array()
      .parse(JSON.parse(env.insights.warehouse.applicationsJson || '[]'));
  } else {
    const config = await getWorkspaceConfig(workspaceId, 'warehouse');
    if (!config) {
      return [];
    }

    const enable = get(config, 'enabled', true);
    if (!enable) {
      return [];
    }

    const defaultDatabaseUrl = get(config, 'defaultDatabaseUrl', undefined);

    applications = get(config, 'applications', []).map(
      (app: WarehouseInsightsApplication) => ({
        ...app,
        databaseUrl: app.databaseUrl || defaultDatabaseUrl,
      })
    );
  }

  // Cache the result
  warehouseApplicationsCache.set(workspaceId, {
    applications,
    timestamp: now,
  });

  return applications;
}

export function findWarehouseApplication(
  workspaceId: string,
  name: string
): Promise<WarehouseInsightsApplication | undefined> {
  return getWarehouseApplications(workspaceId).then((apps) =>
    apps.find((app) => app.name === name)
  );
}

// Helper function to clear cache when warehouse config is updated
export function clearWarehouseApplicationsCache(workspaceId?: string): void {
  if (workspaceId) {
    warehouseApplicationsCache.delete(workspaceId);
  } else {
    warehouseApplicationsCache.clear();
  }
}

const connections = new Map<string, Pool>();
export function getWarehouseConnection(url = env.insights.warehouse.url) {
  if (!url) {
    throw new Error('Warehouse url is not set');
  }

  let connection = connections.get(url);
  if (!connection) {
    connection = createPool(url);
    connections.set(url, connection);
  }

  return connection;
}

/**
 * Ping the warehouse connection by URL (or default env url).
 * Returns true if the connection is healthy.
 */
export async function pingWarehouse(
  url = env.insights.warehouse.url
): Promise<boolean> {
  if (!url) return false;
  const conn = await createConnection(url);
  try {
    await conn.query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  } finally {
    try {
      await conn?.end();
    } catch {}
  }
}

const cachedWarehouseTables = new Map<string, WarehouseTableMeta[]>();
export async function getWarehouseTables(
  url = env.insights.warehouse.url
): Promise<WarehouseTableMeta[]> {
  if (!url) {
    throw new Error('Warehouse url is not set');
  }

  if (cachedWarehouseTables.has(url)) {
    return cachedWarehouseTables.get(url)!;
  }

  const connection = getWarehouseConnection(url);
  const [res, fields] = await connection.query(
    `SHOW TABLES WHERE Table_type = 'BASE TABLE';`
  );

  if (fields.length > 1) {
    throw new Error('Multiple tables found, not supported yet.');
  }

  const tableNames = Array.from<Record<string, string>>(res as any).map(
    (row) => row[fields[0].name]
  );

  const tables = await Promise.all<WarehouseTableMeta>(
    tableNames.map(async (table) => {
      const [res] = await connection.query(`SHOW CREATE TABLE ${table}`);

      const tableName = get(res, [0, 'Table']);
      const ddl = get(res, [0, 'Create Table']);

      return {
        tableName: tableName as string,
        ddl: ddl as string,
      };
    })
  );

  cachedWarehouseTables.set(url, tables);

  return tables;
}
export async function getWarehouseTable(
  tableName: string,
  url = env.insights.warehouse.url
): Promise<WarehouseTableMeta | undefined> {
  const tables = await getWarehouseTables(url);
  return tables.find((table) => table.tableName === tableName);
}

async function getWarehouseScopeDatabase(
  workspaceId: string,
  databaseId: string
): Promise<WarehouseDatabaseTable[]> {
  return await prisma.warehouseDatabaseTable.findMany({
    where: {
      workspaceId: workspaceId,
      databaseId: databaseId,
    },
  });
}

async function getWarehouseScopeDatabaseTable(
  workspaceId: string,
  tableId: string
): Promise<WarehouseDatabaseTable | null> {
  return await prisma.warehouseDatabaseTable.findFirst({
    where: {
      workspaceId: workspaceId,
      id: tableId,
    },
  });
}

export async function getWarehouseScopes(
  workspaceId: string,
  scopes: Array<{ type: 'database' | 'table'; id: string; name: string }>
): Promise<WarehouseDatabaseTable[]> {
  const tables = flatten(
    await Promise.all(
      scopes.map(async (scope) => {
        if (scope.type === 'database') {
          const tables = await getWarehouseScopeDatabase(workspaceId, scope.id);
          return tables;
        }

        if (scope.type === 'table') {
          const table = await getWarehouseScopeDatabaseTable(
            workspaceId,
            scope.id
          );
          if (table) {
            return [table];
          }

          return [];
        }

        return [];
      })
    )
  );

  return uniqBy(tables, 'id');
}

export function getFieldType(type: number): string {
  // MySQL field type mapping
  // Reference: https://dev.mysql.com/doc/dev/mysql-server/latest/field__types_8h.html
  const typeMap: Record<number, string> = {
    0: 'DECIMAL',
    1: 'TINY',
    2: 'SHORT',
    3: 'LONG',
    4: 'FLOAT',
    5: 'DOUBLE',
    6: 'NULL',
    7: 'TIMESTAMP',
    8: 'LONGLONG',
    9: 'INT24',
    10: 'DATE',
    11: 'TIME',
    12: 'DATETIME',
    13: 'YEAR',
    14: 'NEWDATE',
    15: 'VARCHAR',
    16: 'BIT',
    245: 'JSON',
    246: 'NEWDECIMAL',
    247: 'ENUM',
    248: 'SET',
    249: 'TINY_BLOB',
    250: 'MEDIUM_BLOB',
    251: 'LONG_BLOB',
    252: 'BLOB',
    253: 'VAR_STRING',
    254: 'STRING',
    255: 'GEOMETRY',
  };

  return typeMap[type] || 'UNKNOWN';
}
