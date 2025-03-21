import { createClient } from '@clickhouse/client';
import { logger } from '../utils/logger.js';
import { env } from '../utils/env.js';

export const clickhouse = createClient({
  url: env.clickhouse.url,
  username: env.clickhouse.username,
  password: env.clickhouse.password,
  database: env.clickhouse.database,
});

// init clickhouse
export async function initClickHouse() {
  try {
    const pingResult = await clickhouse.ping();
    if (pingResult.success) {
      logger.info('ClickHouse connection successful');
    } else {
      logger.error('ClickHouse ping failed');
    }
  } catch (err) {
    logger.error('ClickHouse connection error:', err);
  }
}
