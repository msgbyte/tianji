import { z } from 'zod';
import {
  createPool as createMysqlPool,
  Pool as MysqlPool,
  createConnection as createMysqlConnection,
} from 'mysql2/promise';
import pg from 'pg';
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

export type WarehouseDriver = 'mysql' | 'postgresql';

/**
 * Detect driver from connection URL protocol
 */
export function detectDriverFromUrl(url: string): WarehouseDriver {
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.replace(/:$/, '').toLowerCase();
    if (protocol === 'postgresql' || protocol === 'postgres') {
      return 'postgresql';
    }
    return 'mysql';
  } catch {
    return 'mysql';
  }
}

/**
 * Extract schema from PostgreSQL connection URL
 * Defaults to 'public' if not specified
 */
export function extractSchemaFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('schema') || 'public';
  } catch {
    return 'public';
  }
}

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

// PostgreSQL date formats for different time units
export const POSTGRESQL_DATE_FORMATS = {
  minute: 'YYYY-MM-DD HH24:MI:00',
  hour: 'YYYY-MM-DD HH24:00:00',
  day: 'YYYY-MM-DD',
  month: 'YYYY-MM-01',
  year: 'YYYY-01-01',
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

// Connection pool types
export type WarehouseConnection =
  | { driver: 'mysql'; pool: MysqlPool }
  | { driver: 'postgresql'; pool: pg.Pool };

const mysqlConnections = new Map<string, MysqlPool>();
const pgConnections = new Map<string, pg.Pool>();

export function getWarehouseConnection(
  url: string,
  driver?: WarehouseDriver
): WarehouseConnection {
  if (!url) {
    throw new Error('Warehouse url is not set');
  }

  const detectedDriver = driver ?? detectDriverFromUrl(url);

  if (detectedDriver === 'postgresql') {
    let pool = pgConnections.get(url);
    if (!pool) {
      const schema = extractSchemaFromUrl(url);
      pool = new pg.Pool({
        connectionString: url,
        options: `-c search_path=${schema},public`,
      });
      console.log('pool', pool);
      pgConnections.set(url, pool);
    }
    return { driver: 'postgresql', pool };
  }

  // Default to MySQL
  let pool = mysqlConnections.get(url);
  if (!pool) {
    pool = createMysqlPool(url);
    mysqlConnections.set(url, pool);
  }
  return { driver: 'mysql', pool };
}

/**
 * Ping the warehouse connection by URL (or default env url).
 * Returns true if the connection is healthy.
 */
export async function pingWarehouse(
  url = env.insights.warehouse.url,
  driver?: WarehouseDriver
): Promise<boolean> {
  if (!url) return false;

  const detectedDriver = driver ?? detectDriverFromUrl(url);

  if (detectedDriver === 'postgresql') {
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      await client.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    } finally {
      try {
        await client.end();
      } catch {}
    }
  }

  // MySQL
  const conn = await createMysqlConnection(url);
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

async function getMysqlTables(pool: MysqlPool): Promise<WarehouseTableMeta[]> {
  const [res, fields] = await pool.query(
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
      const [res] = await pool.query(`SHOW CREATE TABLE ${table}`);

      const tableName = get(res, [0, 'Table']);
      const ddl = get(res, [0, 'Create Table']);

      return {
        tableName: tableName as string,
        ddl: ddl as string,
      };
    })
  );

  return tables;
}

async function getPostgresqlTables(
  pool: pg.Pool,
  schema: string = 'public'
): Promise<WarehouseTableMeta[]> {
  // Get table names from information_schema
  const tablesResult = await pool.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = $1
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `,
    [schema]
  );

  const tableNames = tablesResult.rows.map(
    (row: { table_name: string }) => row.table_name
  );

  const tables = await Promise.all<WarehouseTableMeta>(
    tableNames.map(async (tableName) => {
      // Generate DDL-like structure for PostgreSQL
      const columnsResult = await pool.query(
        `
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position;
      `,
        [schema, tableName]
      );

      // Build a DDL-like string from column info
      const columns = columnsResult.rows
        .map((col: any) => {
          let colDef = `  "${col.column_name}" ${col.data_type.toUpperCase()}`;
          if (col.character_maximum_length) {
            colDef += `(${col.character_maximum_length})`;
          }
          if (col.is_nullable === 'NO') {
            colDef += ' NOT NULL';
          }
          if (col.column_default) {
            colDef += ` DEFAULT ${col.column_default}`;
          }
          return colDef;
        })
        .join(',\n');

      const ddl = `CREATE TABLE "${schema}"."${tableName}" (\n${columns}\n);`;

      return {
        tableName,
        ddl,
      };
    })
  );

  return tables;
}

export async function getWarehouseTables(
  url = env.insights.warehouse.url,
  driver?: WarehouseDriver
): Promise<WarehouseTableMeta[]> {
  if (!url) {
    throw new Error('Warehouse url is not set');
  }

  if (cachedWarehouseTables.has(url)) {
    return cachedWarehouseTables.get(url)!;
  }

  const connection = getWarehouseConnection(url, driver);

  let tables: WarehouseTableMeta[];
  if (connection.driver === 'postgresql') {
    const schema = extractSchemaFromUrl(url);
    tables = await getPostgresqlTables(connection.pool, schema);
  } else {
    tables = await getMysqlTables(connection.pool);
  }

  cachedWarehouseTables.set(url, tables);

  return tables;
}

export async function getWarehouseTable(
  tableName: string,
  url = env.insights.warehouse.url,
  driver?: WarehouseDriver
): Promise<WarehouseTableMeta | undefined> {
  const tables = await getWarehouseTables(url, driver);
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

export function getMysqlFieldType(type: number): string {
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

export function getPostgresqlFieldType(typeOid: number): string {
  // PostgreSQL OID type mapping
  // Reference: https://www.postgresql.org/docs/current/catalog-pg-type.html
  const typeMap: Record<number, string> = {
    16: 'BOOLEAN',
    17: 'BYTEA',
    18: 'CHAR',
    19: 'NAME',
    20: 'BIGINT',
    21: 'SMALLINT',
    23: 'INTEGER',
    25: 'TEXT',
    26: 'OID',
    700: 'REAL',
    701: 'DOUBLE PRECISION',
    790: 'MONEY',
    1042: 'CHAR',
    1043: 'VARCHAR',
    1082: 'DATE',
    1083: 'TIME',
    1114: 'TIMESTAMP',
    1184: 'TIMESTAMPTZ',
    1186: 'INTERVAL',
    1266: 'TIMETZ',
    1560: 'BIT',
    1562: 'VARBIT',
    1700: 'NUMERIC',
    2950: 'UUID',
    3802: 'JSONB',
    114: 'JSON',
    142: 'XML',
    600: 'POINT',
    601: 'LSEG',
    602: 'PATH',
    603: 'BOX',
    604: 'POLYGON',
    628: 'LINE',
    718: 'CIRCLE',
    869: 'INET',
    650: 'CIDR',
    829: 'MACADDR',
    774: 'MACADDR8',
    1000: 'BOOLEAN[]',
    1005: 'SMALLINT[]',
    1007: 'INTEGER[]',
    1009: 'TEXT[]',
    1016: 'BIGINT[]',
    1021: 'REAL[]',
    1022: 'DOUBLE PRECISION[]',
    1231: 'NUMERIC[]',
  };

  return typeMap[typeOid] || 'UNKNOWN';
}

/**
 * Get field type for both MySQL and PostgreSQL
 * @deprecated Use getMysqlFieldType or getPostgresqlFieldType directly
 */
export function getFieldType(type: number): string {
  return getMysqlFieldType(type);
}
