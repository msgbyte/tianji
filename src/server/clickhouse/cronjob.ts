import { Prisma } from '@prisma/client';
import { Cron } from 'croner';
import { clickhouse } from './index.js';
import { prisma } from '../model/_client.js';
import { logger } from '../utils/logger.js';
import dayjs from 'dayjs';
import { env } from '../utils/env.js';
import { withDistributedLock } from '../cache/index.js';
import { quoteSqlIdentifier } from '../utils/sql.js';

interface SyncTableConfig {
  pgTable: string;
  chTable: string;
  idField: string;
  idType: 'uuid' | 'text';
  timestampField: string;
}

interface SyncCursor {
  timestamp: string;
  id: string;
}

type SyncRow = Record<string, unknown>;

// Tables to sync from PostgreSQL to ClickHouse
const TABLES_TO_SYNC: SyncTableConfig[] = [
  {
    pgTable: 'WebsiteSession',
    chTable: 'WebsiteSession',
    idField: 'id',
    idType: 'uuid',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'WebsiteEvent',
    chTable: 'WebsiteEvent',
    idField: 'id',
    idType: 'text',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'WebsiteEventData',
    chTable: 'WebsiteEventData',
    idField: 'id',
    idType: 'text',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'WebsiteSessionData',
    chTable: 'WebsiteSessionData',
    idField: 'id',
    idType: 'text',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'ApplicationSession',
    chTable: 'ApplicationSession',
    idField: 'id',
    idType: 'uuid',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'ApplicationEvent',
    chTable: 'ApplicationEvent',
    idField: 'id',
    idType: 'text',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'ApplicationEventData',
    chTable: 'ApplicationEventData',
    idField: 'id',
    idType: 'text',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'ApplicationSessionData',
    chTable: 'ApplicationSessionData',
    idField: 'id',
    idType: 'text',
    timestampField: 'createdAt',
  },
];

// Table to store sync state
const SYNC_STATE_TABLE = '_clickhouse_sync_state';
const CURSOR_TS_ALIAS = '__cursor_ts';
const SYNC_SAFETY_LAG_SECONDS = 10;
const STATE_UPDATE_BATCH_INTERVAL = 10;

// Initialize sync state table
async function initSyncStateTable() {
  try {
    await clickhouse.exec({
      query: `
        CREATE TABLE IF NOT EXISTS ${SYNC_STATE_TABLE} (
          table_name String,
          last_sync_timestamp DateTime64(3, 'UTC'),
          updated_at DateTime64(3, 'UTC') DEFAULT now64(3, 'UTC')
        ) ENGINE = MergeTree()
        ORDER BY table_name
      `,
    });
  } catch (err) {
    logger.error('Failed to initialize sync state table:', err);
    throw err;
  }
}

// Get last sync timestamp for a table
async function getLastSyncTimestamp(tableName: string): Promise<number | null> {
  try {
    const result = await clickhouse.query({
      // NOTICE: toUnixTimestamp64Milli need clickhouse version >= 22.10
      query: `
        SELECT toUnixTimestamp64Milli(last_sync_timestamp) as last_sync_timestamp
        FROM ${SYNC_STATE_TABLE}
        WHERE table_name = {table:String}
        ORDER BY last_sync_timestamp DESC
        LIMIT 1
      `,
      query_params: {
        table: tableName,
      },
    });

    const { data } = await result.json<{ last_sync_timestamp: string }>();
    if (data.length === 0) {
      return null;
    }
    return Number(data[0].last_sync_timestamp);
  } catch (err) {
    logger.error(`Failed to get last sync timestamp for ${tableName}:`, err);
    throw err;
  }
}

// Append sync state checkpoint for a table without triggering ClickHouse mutations
async function updateSyncState(
  tableName: string,
  timestamp: string | number | Date
) {
  try {
    // Convert timestamp to Unix timestamp in milliseconds for ClickHouse
    const formattedTimestamp = dayjs(timestamp).valueOf();
    if (!Number.isFinite(formattedTimestamp) || formattedTimestamp < 0) {
      throw new Error(
        `Invalid sync state timestamp for ${tableName}: ${String(timestamp)}`
      );
    }

    await clickhouse.exec({
      query: `
        INSERT INTO ${SYNC_STATE_TABLE} (table_name, last_sync_timestamp)
        VALUES ({table:String}, toDateTime64({timestamp:UInt64} / 1000.0, 3, 'UTC'))
      `,
      query_params: {
        table: tableName,
        timestamp: formattedTimestamp,
      },
    });
  } catch (err) {
    logger.error(`Failed to update sync state for ${tableName}:`, err);
    throw err;
  }
}

async function getPostgresSyncUpperBoundMs(): Promise<number> {
  const rows = await prisma.$queryRaw<
    { upperBoundMs: bigint | number | string }[]
  >`
    SELECT floor(extract(epoch from (now() - make_interval(secs => ${SYNC_SAFETY_LAG_SECONDS}::double precision))) * 1000)::bigint AS "upperBoundMs"
  `;

  const upperBoundMs = Number(rows[0]?.upperBoundMs);
  if (!Number.isFinite(upperBoundMs) || upperBoundMs < 0) {
    throw new Error('Failed to resolve PostgreSQL sync upper bound timestamp');
  }

  return upperBoundMs;
}

function buildSyncBatchQuery(params: {
  tableConfig: SyncTableConfig;
  lastSyncIso: string | null;
  syncUpperBoundIso: string;
  cursor: SyncCursor | null;
  batchSize: number;
}): Prisma.Sql {
  const { tableConfig, lastSyncIso, syncUpperBoundIso, cursor, batchSize } =
    params;
  const tableRef = quoteSqlIdentifier(tableConfig.pgTable);
  const idCol = quoteSqlIdentifier(tableConfig.idField);
  const timestampCol = quoteSqlIdentifier(tableConfig.timestampField);
  const cursorTsAlias = quoteSqlIdentifier(CURSOR_TS_ALIAS);
  const idCast =
    tableConfig.idType === 'uuid' ? Prisma.raw('::uuid') : Prisma.raw('::text');

  // Preserve full microsecond precision for the pagination cursor and rely on
  // the existing single-column createdAt index via `createdAt >= $1` + incremental sort.
  const whereClause = cursor
    ? Prisma.sql`
        WHERE ${timestampCol} >= ${cursor.timestamp}::timestamptz
          AND (${timestampCol} > ${cursor.timestamp}::timestamptz OR ${idCol} > ${cursor.id}${idCast})
          AND ${timestampCol} <= ${syncUpperBoundIso}::timestamptz
      `
    : lastSyncIso !== null
      ? Prisma.sql`
          WHERE ${timestampCol} > ${lastSyncIso}::timestamptz
            AND ${timestampCol} <= ${syncUpperBoundIso}::timestamptz
        `
      : Prisma.sql`
          WHERE ${timestampCol} <= ${syncUpperBoundIso}::timestamptz
        `;

  return Prisma.sql`
    SELECT *, to_char(${timestampCol} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS ${cursorTsAlias}
    FROM ${tableRef}
    ${whereClause}
    ORDER BY ${timestampCol} ASC, ${idCol} ASC
    LIMIT ${batchSize}
  `;
}

function extractCursorTimestamp(row: SyncRow, timestampField: string): string {
  const cursorTs = row[CURSOR_TS_ALIAS];
  if (typeof cursorTs === 'string' && cursorTs.length > 0) {
    return cursorTs;
  }

  const rawTimestamp = row[timestampField];
  if (rawTimestamp instanceof Date) {
    return rawTimestamp.toISOString();
  }

  return String(rawTimestamp);
}

function formatRowForClickHouse(row: SyncRow): SyncRow {
  const formattedRow: SyncRow = { ...row };
  delete formattedRow[CURSOR_TS_ALIAS];

  Object.keys(formattedRow).forEach((key) => {
    const value = formattedRow[key];
    if (value instanceof Date) {
      // Convert to Unix timestamp in milliseconds to preserve precision
      formattedRow[key] = value.getTime();
    } else if (value === null) {
      // Handle null values based on column type
      delete formattedRow[key];
    }
  });

  return formattedRow;
}

// Sync data for a specific table
async function syncTable(tableConfig: SyncTableConfig) {
  const { pgTable, chTable, idField, timestampField } = tableConfig;

  let lastPersistedTimestamp: number | null = null;
  let latestSyncedTimestampMs: number | null = null;
  let syncedRows = 0;
  let batchesSinceStateUpdate = 0;
  let completedAllBatches = false;

  try {
    // Get last sync timestamp
    const lastSyncTimestamp = await getLastSyncTimestamp(pgTable);
    lastPersistedTimestamp = lastSyncTimestamp;

    const syncUpperBoundMs = await getPostgresSyncUpperBoundMs();
    if (lastSyncTimestamp !== null && lastSyncTimestamp >= syncUpperBoundMs) {
      return true;
    }

    const lastSyncIso =
      lastSyncTimestamp !== null
        ? new Date(lastSyncTimestamp).toISOString()
        : null;
    const syncUpperBoundIso = new Date(syncUpperBoundMs).toISOString();

    // Get data from PostgreSQL in batches using (createdAt, id) keyset pagination
    const batchSize = Math.max(1, Math.trunc(env.clickhouse.sync.batchSize));
    let hasMore = true;
    let cursor: SyncCursor | null = null;

    while (hasMore) {
      const query = buildSyncBatchQuery({
        tableConfig,
        lastSyncIso,
        syncUpperBoundIso,
        cursor,
        batchSize,
      });

      const data = await prisma.$queryRaw<SyncRow[]>(query);

      if (data.length === 0) {
        completedAllBatches = true;
        hasMore = false;
        continue;
      }

      const rows = data.map(formatRowForClickHouse);

      // Insert data into ClickHouse
      await clickhouse.insert({
        table: chTable,
        values: rows,
        format: 'JSONEachRow',
      });

      const lastRow = data[data.length - 1];
      const lastCursorTimestamp = extractCursorTimestamp(
        lastRow,
        timestampField
      );
      const lastId = String(lastRow[idField]);

      cursor = {
        timestamp: lastCursorTimestamp,
        id: lastId,
      };
      latestSyncedTimestampMs = dayjs(lastCursorTimestamp).valueOf();
      syncedRows += data.length;
      batchesSinceStateUpdate += 1;

      logger.info(`Synced ${data.length} rows to ${chTable}`);

      // If we got less than the batch size, we're done
      if (data.length < batchSize) {
        completedAllBatches = true;
        hasMore = false;
      } else if (batchesSinceStateUpdate >= STATE_UPDATE_BATCH_INTERVAL) {
        // Persist a safe mid-run checkpoint (1ms back to preserve sub-ms siblings on crash)
        const checkpointMs = Math.max(0, latestSyncedTimestampMs - 1);
        if (
          lastPersistedTimestamp === null ||
          checkpointMs > lastPersistedTimestamp
        ) {
          await updateSyncState(pgTable, checkpointMs);
          lastPersistedTimestamp = checkpointMs;
        }
        batchesSinceStateUpdate = 0;
      }
    }

    if (completedAllBatches && syncedRows > 0) {
      if (
        lastPersistedTimestamp === null ||
        syncUpperBoundMs > lastPersistedTimestamp
      ) {
        await updateSyncState(pgTable, syncUpperBoundMs);
        lastPersistedTimestamp = syncUpperBoundMs;
      }
    }

    return true;
  } catch (err) {
    // Persist progress from previously succeeded batches on partial failure
    if (
      !completedAllBatches &&
      syncedRows > 0 &&
      latestSyncedTimestampMs !== null
    ) {
      const checkpointMs = Math.max(0, latestSyncedTimestampMs - 1);
      if (
        lastPersistedTimestamp === null ||
        checkpointMs > lastPersistedTimestamp
      ) {
        try {
          await updateSyncState(pgTable, checkpointMs);
          lastPersistedTimestamp = checkpointMs;
        } catch (stateErr) {
          logger.error(
            `Failed to persist partial sync checkpoint for ${pgTable}:`,
            stateErr
          );
        }
      }
    }

    logger.error(`Error syncing table ${pgTable} to ${chTable}:`, err);
    return false;
  }
}

let isSyncing = false;
export async function syncPostgresToClickHouse() {
  if (isSyncing) {
    logger.info(
      'PostgreSQL to ClickHouse sync is already running on this instance'
    );
    return false;
  }

  const result = await withDistributedLock(
    'tianji-clickhouse-sync',
    async () => {
      // Set local sync state
      isSyncing = true;

      try {
        logger.info('Starting PostgreSQL to ClickHouse sync');

        // Initialize sync state table
        await initSyncStateTable();

        // Sync each table
        const failedTables: string[] = [];
        for (const tableConfig of TABLES_TO_SYNC) {
          const synced = await syncTable(tableConfig);
          if (!synced) {
            failedTables.push(tableConfig.pgTable);
          }
        }

        if (failedTables.length > 0) {
          logger.warn(
            `PostgreSQL to ClickHouse sync completed with failures: ${failedTables.join(', ')}`
          );
          return false;
        }

        logger.info('PostgreSQL to ClickHouse sync completed successfully');
        return true;
      } catch (err) {
        logger.error('PostgreSQL to ClickHouse sync failed:', err);
        throw err;
      } finally {
        // Always reset local sync state
        isSyncing = false;
      }
    },
    {
      timeout: 1 * 60 * 60 * 1000, // 1 hour timeout for sync job
      skipOnFailure: true,
    }
  );

  if (result === null) {
    logger.info(
      'PostgreSQL to ClickHouse sync skipped - already running on another instance'
    );
    return false;
  }

  return result;
}

// Initialize cronjob
export function initClickHouseSyncCronjob() {
  // Run every hour
  const job = Cron(
    env.clickhouse.debug ? '* * * * *' : '0/20 * * * *',
    async () => {
      try {
        await syncPostgresToClickHouse();
      } catch (err) {
        logger.error('Scheduled PostgreSQL to ClickHouse sync failed:', err);
      }
    }
  );

  logger.info(
    'ClickHouse sync job will start at:',
    job.nextRun()?.toISOString()
  );

  return job;
}
