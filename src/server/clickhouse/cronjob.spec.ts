import 'dotenv/config';
import type { Prisma } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

function normalizeRawQueryCall(
  first: Prisma.Sql | TemplateStringsArray,
  rest: unknown[]
): { sql: string; values: unknown[] } {
  if ('strings' in first) {
    return {
      sql: first.strings.join('?'),
      values: [...first.values],
    };
  }

  return {
    sql: first.join('?'),
    values: rest,
  };
}

describe('syncPostgresToClickHouse', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('../cache/index.js');
    vi.doUnmock('../model/_client.js');
    vi.doUnmock('../utils/env.js');
    vi.doUnmock('../utils/logger.js');
    vi.doUnmock('./index.js');
    vi.restoreAllMocks();
    vi.resetModules();
    vi.useRealTimers();
  });

  test('advances the (createdAt, id) keyset cursor across batches and appends sync state without ALTER TABLE UPDATE', async () => {
    const lastSyncMs = new Date('2026-11-26T09:40:00.000Z').getTime();
    const expectedUpperBoundIso = '2026-11-26T10:00:00.000Z';
    const expectedUpperBoundMs = new Date(expectedUpperBoundIso).getTime();

    const executedQueries: { sql: string; values: unknown[] }[] = [];
    const clickhouseInserts: { table: string; values: unknown[] }[] = [];
    const clickhouseExecCalls: { query: string; query_params?: unknown }[] = [];
    const clickhouseQueryCalls: { query: string; query_params?: unknown }[] =
      [];

    let appEventDataCall = 0;
    let websiteSessionCall = 0;

    const queryRaw = vi.fn(
      async (first: Prisma.Sql | TemplateStringsArray, ...rest: unknown[]) => {
        const { sql, values } = normalizeRawQueryCall(first, rest);
        executedQueries.push({ sql, values });

      if (sql.includes('"upperBoundMs"')) {
        return [{ upperBoundMs: BigInt(expectedUpperBoundMs) }];
      }

      if (sql.includes('"ApplicationEventData"')) {
        appEventDataCall += 1;
        if (appEventDataCall === 1) {
          return [
            {
              id: 'evt_001',
              applicationId: 'app_1',
              applicationEventId: 'ae_1',
              eventKey: 'screen',
              stringValue: 'home',
              numberValue: null,
              dateValue: null,
              dataType: 1,
              createdAt: new Date('2026-11-26T09:45:00.123Z'),
              __cursor_ts: '2026-11-26T09:45:00.123456Z',
            },
            {
              id: 'evt_002',
              applicationId: 'app_1',
              applicationEventId: 'ae_1',
              eventKey: 'tier',
              stringValue: 'pro',
              numberValue: null,
              dateValue: null,
              dataType: 1,
              createdAt: new Date('2026-11-26T09:45:00.123Z'),
              __cursor_ts: '2026-11-26T09:45:00.123456Z',
            },
          ];
        }

        return [
          {
            id: 'evt_003',
            applicationId: 'app_1',
            applicationEventId: 'ae_2',
            eventKey: 'screen',
            stringValue: 'settings',
            numberValue: null,
            dateValue: null,
            dataType: 1,
            createdAt: new Date('2026-11-26T09:50:00.500Z'),
            __cursor_ts: '2026-11-26T09:50:00.500789Z',
          },
        ];
      }

      if (sql.includes('"WebsiteSession"')) {
        websiteSessionCall += 1;
        if (websiteSessionCall === 1) {
          return [
            {
              id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              websiteId: 'web_1',
              createdAt: new Date('2026-11-26T09:41:00.000Z'),
              __cursor_ts: '2026-11-26T09:41:00.000100Z',
            },
            {
              id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
              websiteId: 'web_1',
              createdAt: new Date('2026-11-26T09:41:00.000Z'),
              __cursor_ts: '2026-11-26T09:41:00.000100Z',
            },
          ];
        }

        return [
          {
            id: '00000000-0000-4000-8000-000000000001',
            websiteId: 'web_1',
            createdAt: new Date('2026-11-26T09:42:00.000Z'),
            __cursor_ts: '2026-11-26T09:42:00.000200Z',
          },
        ];
      }

      return [];
    });

    vi.doMock('../cache/index.js', () => ({
      withDistributedLock: vi.fn(
        async (_key: string, task: () => Promise<boolean>) => task()
      ),
    }));
    vi.doMock('../model/_client.js', () => ({
      prisma: {
        $queryRaw: queryRaw,
      },
    }));
    vi.doMock('../utils/env.js', () => ({
      env: {
        clickhouse: {
          debug: false,
          sync: {
            enable: true,
            batchSize: 2,
          },
        },
      },
    }));
    vi.doMock('../utils/logger.js', () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock('./index.js', () => ({
      clickhouse: {
        exec: vi.fn(async (opts: { query: string; query_params?: unknown }) => {
          clickhouseExecCalls.push(opts);
        }),
        query: vi.fn(
          async (opts: { query: string; query_params?: { table?: string } }) => {
            clickhouseQueryCalls.push(opts);
            return {
              json: async () => ({
                data: [{ last_sync_timestamp: String(lastSyncMs) }],
              }),
            };
          }
        ),
        insert: vi.fn(async (opts: { table: string; values: unknown[] }) => {
          clickhouseInserts.push(opts);
        }),
      },
    }));

    const { syncPostgresToClickHouse: runSync } = await import('./cronjob.js');
    const result = await runSync();

    expect(result).toBe(true);

    // State query should select the monotonic maximum sync timestamp
    expect(clickhouseQueryCalls.length).toBeGreaterThan(0);
    for (const call of clickhouseQueryCalls) {
      expect(call.query).toContain('ORDER BY last_sync_timestamp DESC');
      expect(call.query).toContain('LIMIT 1');
    }

    // Upper bound should be resolved from PostgreSQL clock rather than Node clock
    const upperBoundQueries = executedQueries.filter((q) =>
      q.sql.includes('"upperBoundMs"')
    );
    expect(upperBoundQueries).toHaveLength(8);
    expect(upperBoundQueries[0].values).toEqual([10]);

    // ApplicationEventData should advance (createdAt, id) with microsecond precision
    const appQueries = executedQueries.filter((q) =>
      q.sql.includes('"ApplicationEventData"')
    );
    expect(appQueries).toHaveLength(2);
    expect(appQueries[0].sql).toContain('WHERE "createdAt" > ?::timestamptz');
    expect(appQueries[0].sql).toContain(
      'ORDER BY "createdAt" ASC, "id" ASC'
    );
    expect(appQueries[0].values).toEqual([
      '2026-11-26T09:40:00.000Z',
      expectedUpperBoundIso,
      2,
    ]);

    expect(appQueries[1].sql).toContain(
      'WHERE "createdAt" >= ?::timestamptz'
    );
    expect(appQueries[1].sql).toContain(
      'AND ("createdAt" > ?::timestamptz OR "id" > ?::text)'
    );
    expect(appQueries[1].values).toEqual([
      '2026-11-26T09:45:00.123456Z',
      '2026-11-26T09:45:00.123456Z',
      'evt_002',
      expectedUpperBoundIso,
      2,
    ]);

    // UUID tables should cast id cursor to ::uuid
    const sessionQueries = executedQueries.filter((q) =>
      q.sql.includes('"WebsiteSession"')
    );
    expect(sessionQueries).toHaveLength(2);
    expect(sessionQueries[1].sql).toContain(
      'AND ("createdAt" > ?::timestamptz OR "id" > ?::uuid)'
    );
    expect(sessionQueries[1].values).toEqual([
      '2026-11-26T09:41:00.000100Z',
      '2026-11-26T09:41:00.000100Z',
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      expectedUpperBoundIso,
      2,
    ]);

    // Inserted rows must not leak the synthetic cursor column or null fields
    const appInsertBatch1 = clickhouseInserts.find(
      (i) => i.table === 'ApplicationEventData'
    );
    expect(appInsertBatch1?.values).toEqual([
      {
        id: 'evt_001',
        applicationId: 'app_1',
        applicationEventId: 'ae_1',
        eventKey: 'screen',
        stringValue: 'home',
        dataType: 1,
        createdAt: new Date('2026-11-26T09:45:00.123Z').getTime(),
      },
      {
        id: 'evt_002',
        applicationId: 'app_1',
        applicationEventId: 'ae_1',
        eventKey: 'tier',
        stringValue: 'pro',
        dataType: 1,
        createdAt: new Date('2026-11-26T09:45:00.123Z').getTime(),
      },
    ]);

    // Never issue ALTER TABLE UPDATE mutations on _clickhouse_sync_state
    const stateWrites = clickhouseExecCalls.filter(
      (call) => !call.query.includes('CREATE TABLE IF NOT EXISTS')
    );
    expect(stateWrites).toHaveLength(2);
    for (const write of stateWrites) {
      expect(write.query).toContain('INSERT INTO _clickhouse_sync_state');
      expect(write.query).not.toContain('ALTER TABLE');
      expect(write.query_params).toEqual(
        expect.objectContaining({ timestamp: expectedUpperBoundMs })
      );
    }
  });

  test('does not fall back to a full-table scan when reading sync state fails', async () => {
    const queryRaw = vi.fn();
    const warn = vi.fn();

    vi.doMock('../cache/index.js', () => ({
      withDistributedLock: vi.fn(
        async (_key: string, task: () => Promise<boolean>) => task()
      ),
    }));
    vi.doMock('../model/_client.js', () => ({
      prisma: {
        $queryRaw: queryRaw,
      },
    }));
    vi.doMock('../utils/env.js', () => ({
      env: {
        clickhouse: {
          debug: false,
          sync: {
            enable: true,
            batchSize: 100,
          },
        },
      },
    }));
    vi.doMock('../utils/logger.js', () => ({
      logger: { info: vi.fn(), warn, error: vi.fn() },
    }));
    vi.doMock('./index.js', () => ({
      clickhouse: {
        exec: vi.fn(async () => {}),
        query: vi.fn(async () => {
          throw new Error('ClickHouse read timeout');
        }),
        insert: vi.fn(async () => {}),
      },
    }));

    const { syncPostgresToClickHouse: runSync } = await import('./cronjob.js');
    const result = await runSync();

    expect(result).toBe(false);
    expect(queryRaw).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('persists a safe partial checkpoint when a later batch fails', async () => {
    const lastSyncMs = new Date('2026-11-26T09:40:00.000Z').getTime();
    const expectedUpperBoundMs = new Date('2026-11-26T10:00:00.000Z').getTime();
    const clickhouseExecCalls: { query: string; query_params?: any }[] = [];
    let appEventDataCall = 0;

    const queryRaw = vi.fn(
      async (first: Prisma.Sql | TemplateStringsArray, ...rest: unknown[]) => {
        const { sql } = normalizeRawQueryCall(first, rest);
        if (sql.includes('"upperBoundMs"')) {
        return [{ upperBoundMs: BigInt(expectedUpperBoundMs) }];
      }

      if (!sql.includes('"ApplicationEventData"')) {
        return [];
      }

      appEventDataCall += 1;
      if (appEventDataCall === 1) {
        return [
          {
            id: 'evt_001',
            applicationId: 'app_1',
            createdAt: new Date('2026-11-26T09:45:00.500Z'),
            __cursor_ts: '2026-11-26T09:45:00.500456Z',
          },
          {
            id: 'evt_002',
            applicationId: 'app_1',
            createdAt: new Date('2026-11-26T09:46:00.500Z'),
            __cursor_ts: '2026-11-26T09:46:00.500789Z',
          },
        ];
      }

      throw new Error('PG query timeout');
    });

    vi.doMock('../cache/index.js', () => ({
      withDistributedLock: vi.fn(
        async (_key: string, task: () => Promise<boolean>) => task()
      ),
    }));
    vi.doMock('../model/_client.js', () => ({
      prisma: {
        $queryRaw: queryRaw,
      },
    }));
    vi.doMock('../utils/env.js', () => ({
      env: {
        clickhouse: {
          debug: false,
          sync: {
            enable: true,
            batchSize: 2,
          },
        },
      },
    }));
    vi.doMock('../utils/logger.js', () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock('./index.js', () => ({
      clickhouse: {
        exec: vi.fn(async (opts: { query: string; query_params?: any }) => {
          clickhouseExecCalls.push(opts);
        }),
        query: vi.fn(async () => ({
          json: async () => ({
            data: [{ last_sync_timestamp: String(lastSyncMs) }],
          }),
        })),
        insert: vi.fn(async () => {}),
      },
    }));

    const { syncPostgresToClickHouse: runSync } = await import('./cronjob.js');
    const result = await runSync();

    expect(result).toBe(false);
    const stateWrites = clickhouseExecCalls.filter(
      (call) => !call.query.includes('CREATE TABLE IF NOT EXISTS')
    );
    expect(stateWrites).toHaveLength(1);
    expect(stateWrites[0].query_params).toEqual({
      table: 'ApplicationEventData',
      timestamp: new Date('2026-11-26T09:46:00.499Z').getTime(),
    });
  });

  test('checkpoints periodically during large backlogs and updates watermark on initial sync', async () => {
    const expectedUpperBoundIso = '2026-11-26T10:00:00.000Z';
    const expectedUpperBoundMs = new Date(expectedUpperBoundIso).getTime();
    const clickhouseExecCalls: { query: string; query_params?: any }[] = [];
    const appQueries: { sql: string; values: unknown[] }[] = [];
    let batchNum = 0;

    const queryRaw = vi.fn(
      async (first: Prisma.Sql | TemplateStringsArray, ...rest: unknown[]) => {
        const { sql, values } = normalizeRawQueryCall(first, rest);
        if (sql.includes('"upperBoundMs"')) {
          return [{ upperBoundMs: BigInt(expectedUpperBoundMs) }];
        }

        if (!sql.includes('"ApplicationEventData"')) {
          return [];
        }

        appQueries.push({ sql, values });
        batchNum += 1;

        if (batchNum <= 11) {
          const second = String(batchNum).padStart(2, '0');
          return [
            {
              id: `evt_${second}`,
              applicationId: 'app_1',
              createdAt: new Date(`2026-11-26T09:${second}:00.500Z`),
              __cursor_ts: `2026-11-26T09:${second}:00.500123Z`,
            },
          ];
        }

        // Exact-multiple batch termination: return 0 rows on batch 12
        return [];
      }
    );

    vi.doMock('../cache/index.js', () => ({
      withDistributedLock: vi.fn(
        async (_key: string, task: () => Promise<boolean>) => task()
      ),
    }));
    vi.doMock('../model/_client.js', () => ({
      prisma: {
        $queryRaw: queryRaw,
      },
    }));
    vi.doMock('../utils/env.js', () => ({
      env: {
        clickhouse: {
          debug: false,
          sync: {
            enable: true,
            batchSize: 1,
          },
        },
      },
    }));
    vi.doMock('../utils/logger.js', () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    vi.doMock('./index.js', () => ({
      clickhouse: {
        exec: vi.fn(async (opts: { query: string; query_params?: any }) => {
          clickhouseExecCalls.push(opts);
        }),
        query: vi.fn(async () => ({
          json: async () => ({
            data: [],
          }),
        })),
        insert: vi.fn(async () => {}),
      },
    }));

    const { syncPostgresToClickHouse: runSync } = await import('./cronjob.js');
    const result = await runSync();

    expect(result).toBe(true);
    expect(appQueries).toHaveLength(12);
    // Initial batch without prior sync state should only bound upper timestamp
    expect(appQueries[0].sql).toContain('WHERE "createdAt" <= ?::timestamptz');
    expect(appQueries[0].values).toEqual([expectedUpperBoundIso, 1]);

    // 11 batches -> 1 mid-run checkpoint at batch 10 + 1 final watermark write
    const stateWrites = clickhouseExecCalls.filter(
      (call) => !call.query.includes('CREATE TABLE IF NOT EXISTS')
    );
    expect(stateWrites).toHaveLength(2);
    expect(stateWrites[0].query_params).toEqual({
      table: 'ApplicationEventData',
      timestamp: new Date('2026-11-26T09:10:00.499Z').getTime(),
    });
    expect(stateWrites[1].query_params).toEqual({
      table: 'ApplicationEventData',
      timestamp: expectedUpperBoundMs,
    });
  });
});

describe.runIf(process.env.TEST_CH_CRONJOB)('cronjob', () => {
  test('should pass', { timeout: 100_000 }, async () => {
    const { syncPostgresToClickHouse } = await import('./cronjob.js');
    const success = await syncPostgresToClickHouse();

    expect(success).toBe(true);
  });
});
