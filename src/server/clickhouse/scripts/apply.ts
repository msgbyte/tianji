import 'dotenv/config';
import { clickhouse } from '../index.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { MIGRATIONS_DIR, MIGRATIONS_TABLE } from '../consts.js';
import { env } from '../../utils/env.js';

runClickhouseMigrations().then((success) => {
  if (success) {
    logger.info('ClickHouse migrations applied successfully');
    process.exit(0);
  } else {
    logger.error('ClickHouse migrations failed');
    process.exit(1);
  }
});

// Ensure migration table exists
async function ensureMigrationsTable() {
  try {
    await clickhouse.exec({
      query: `
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
          name String,
          applied_at DateTime DEFAULT now()
        ) ENGINE = MergeTree()
        ORDER BY name
      `,
    });
  } catch (err) {
    logger.error('Failed to create migrations table:', err);
    throw err;
  }
}

// Get applied migrations
async function getAppliedMigrations() {
  try {
    const result = await clickhouse.query({
      query: `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`,
    });

    const { data } = await result.json<{ name: string }>();
    return data.map((row: { name: string }) => row.name);
  } catch (err) {
    logger.error('Failed to get applied migrations:', err);
    return [];
  }
}

// Get all migration files
async function getMigrationFiles() {
  try {
    await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
    const files = await fs.readdir(MIGRATIONS_DIR);
    return files.filter((file) => file.endsWith('.sql')).sort();
  } catch (err) {
    logger.error('Failed to read migration files:', err);
    return [];
  }
}

// Apply migration
async function applyMigration(filename: string) {
  const filePath = path.join(MIGRATIONS_DIR, filename);

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const queries = content
      .split(';')
      .filter((query) => query.trim().length > 0);

    for (const query of queries) {
      await clickhouse.exec({ query: query.trim() });
    }

    await clickhouse.exec({
      query: `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ({filename:String})`,
      query_params: { filename },
    });

    logger.info(`Applied migration: ${filename}`);
    return true;
  } catch (err) {
    logger.error(`Failed to apply migration ${filename}:`, err);
    return false;
  }
}

// Run all unapplied migrations
async function runClickhouseMigrations() {
  if (!env.clickhouse.enable) {
    logger.info('ClickHouse is not enabled, skipping migrations');
    return true;
  }

  try {
    await ensureMigrationsTable();

    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = await getMigrationFiles();

    const pendingMigrations = migrationFiles.filter(
      (file) => !appliedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      logger.info('No pending ClickHouse migrations');
      return true;
    }

    logger.info(
      `Found ${pendingMigrations.length} pending ClickHouse migrations`
    );

    for (const migration of pendingMigrations) {
      const success = await applyMigration(migration);
      if (!success) {
        return false;
      }
    }

    logger.info('All ClickHouse migrations applied successfully');
    return true;
  } catch (err) {
    logger.error('Migration process failed:', err);
    return false;
  }
}
