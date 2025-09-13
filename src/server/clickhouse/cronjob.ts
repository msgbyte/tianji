import { Cron } from 'croner';
import { clickhouse } from './index.js';
import { prisma } from '../model/_client.js';
import { logger } from '../utils/logger.js';
import dayjs from 'dayjs';
import { env } from '../utils/env.js';
import { withDistributedLock } from '../cache/index.js';

// Tables to sync from PostgreSQL to ClickHouse
const TABLES_TO_SYNC = [
  {
    pgTable: 'WebsiteSession',
    chTable: 'WebsiteSession',
    idField: 'id',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'WebsiteEvent',
    chTable: 'WebsiteEvent',
    idField: 'id',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'WebsiteEventData',
    chTable: 'WebsiteEventData',
    idField: 'id',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'WebsiteSessionData',
    chTable: 'WebsiteSessionData',
    idField: 'id',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'ApplicationSession',
    chTable: 'ApplicationSession',
    idField: 'id',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'ApplicationEvent',
    chTable: 'ApplicationEvent',
    idField: 'id',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'ApplicationEventData',
    chTable: 'ApplicationEventData',
    idField: 'id',
    timestampField: 'createdAt',
  },
  {
    pgTable: 'ApplicationSessionData',
    chTable: 'ApplicationSessionData',
    idField: 'id',
    timestampField: 'createdAt',
  },
];

// Table to store sync state
const SYNC_STATE_TABLE = '_clickhouse_sync_state';

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
      query: `SELECT toUnixTimestamp64Milli(last_sync_timestamp) as last_sync_timestamp FROM ${SYNC_STATE_TABLE} WHERE table_name = {table:String}`,
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
    return null;
  }
}

// Update sync state for a table
async function updateSyncState(tableName: string, timestamp: string) {
  try {
    // First check if the record exists
    const result = await clickhouse.query({
      query: `SELECT 1 FROM ${SYNC_STATE_TABLE} WHERE table_name = {table:String}`,
      query_params: {
        table: tableName,
      },
    });

    const { data } = await result.json();
    const exists = data.length > 0;

    // Convert timestamp to Unix timestamp in milliseconds for ClickHouse
    const formattedTimestamp = dayjs(timestamp).valueOf();

    if (exists) {
      // If record exists, update using ALTER TABLE
      await clickhouse.exec({
        query: `
          ALTER TABLE ${SYNC_STATE_TABLE}
          UPDATE last_sync_timestamp = toDateTime64({timestamp:UInt64} / 1000.0, 3, 'UTC'),
                 updated_at = now64(3, 'UTC')
          WHERE table_name = {table:String}
        `,
        query_params: {
          table: tableName,
          timestamp: formattedTimestamp,
        },
      });
    } else {
      // If record doesn't exist, insert new record
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
    }
  } catch (err) {
    logger.error(`Failed to update sync state for ${tableName}:`, err);
    throw err;
  }
}

// Sync data for a specific table
async function syncTable(tableConfig: (typeof TABLES_TO_SYNC)[0]) {
  const { pgTable, chTable, idField, timestampField } = tableConfig;

  try {
    // Get last sync timestamp
    const lastSyncTimestamp = await getLastSyncTimestamp(pgTable);

    // Prepare query to get new data from PostgreSQL
    let query: any = {};
    if (lastSyncTimestamp) {
      const lastSyncDate = dayjs(lastSyncTimestamp).toISOString();

      query = {
        where: {
          [timestampField]: {
            gt: new Date(lastSyncDate),
          },
        },
        orderBy: {
          [timestampField]: 'asc',
        },
      };
    } else {
      query = {
        orderBy: {
          [timestampField]: 'asc',
        },
      };
    }

    // Get data from PostgreSQL in batches
    const batchSize = env.clickhouse.sync.batchSize;
    let hasMore = true;
    let lastId: string | null = null;
    let latestTimestamp: string | null = null;

    while (hasMore) {
      // Modify query to get next batch
      if (lastId) {
        query.where = {
          ...query.where,
          [idField]: {
            gt: lastId,
          },
        };
      }

      // @ts-ignore - Dynamic table access
      const data = await prisma[pgTable].findMany({
        ...query,
        take: batchSize,
      });

      if (data.length === 0) {
        hasMore = false;
        continue;
      }

      // Insert data into ClickHouse
      if (data.length > 0) {
        // Convert data to ClickHouse format
        const rows = data.map((row: any) => {
          // Convert dates to ClickHouse format
          const formattedRow = { ...row };
          Object.keys(formattedRow).forEach((key) => {
            if (formattedRow[key] instanceof Date) {
              // Convert to Unix timestamp in milliseconds to preserve precision
              formattedRow[key] = formattedRow[key].getTime();
            } else if (formattedRow[key] === null) {
              // Handle null values based on column type
              delete formattedRow[key];
            }
          });
          return formattedRow;
        });

        // Insert data into ClickHouse
        await clickhouse.insert({
          table: chTable,
          values: rows,
          format: 'JSONEachRow',
        });

        // Update tracking variables
        lastId = data[data.length - 1][idField];
        latestTimestamp = data[data.length - 1][timestampField];

        logger.info(`Synced ${data.length} rows to ${chTable}`);

        if (latestTimestamp) {
          await updateSyncState(pgTable, latestTimestamp);
        }
      }

      // If we got less than the batch size, we're done
      if (data.length < batchSize) {
        hasMore = false;
      }
    }

    return true;
  } catch (err) {
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
        for (const tableConfig of TABLES_TO_SYNC) {
          await syncTable(tableConfig);
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
  const job = Cron(env.isDev ? '* * * * *' : '0/20 * * * *', async () => {
    try {
      await syncPostgresToClickHouse();
    } catch (err) {
      logger.error('Scheduled PostgreSQL to ClickHouse sync failed:', err);
    }
  });

  logger.info(
    'ClickHouse sync job will start at:',
    job.nextRun()?.toISOString()
  );

  return job;
}
