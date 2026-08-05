import { describe, expect, test, vi } from 'vitest';
import { unwrapSQL } from '../../utils/prisma.js';
import { WebsiteInsightsSqlBuilder } from './website.js';
import { clickhouse } from '../../clickhouse/index.js';

class TestWebsiteInsightsSqlBuilder extends WebsiteInsightsSqlBuilder {
  protected shouldUseClickhouse() {
    return true;
  }

  public buildClickHouseDateQuery(unit: string, timezone: string) {
    return this.getClickHouseDateQuery(
      '"WebsiteEvent"."createdAt"',
      unit,
      timezone
    );
  }
}

describe('WebsiteInsightsSqlBuilder', () => {
  const insightId = 'cly5yay7a001v5tp6xdkzmygh';
  const insightType = 'website';

  test.each(['minute', 'hour', 'day', 'month', 'year'])(
    'binds the %s timezone in ClickHouse date queries',
    (unit) => {
      const maliciousTimezone =
        'UTC\') UNION SELECT password FROM "User" -- ';
      const builder = new TestWebsiteInsightsSqlBuilder(
        {
          insightId,
          insightType,
          workspaceId: '',
          metrics: [],
          filters: [],
          time: {
            startAt: 1739203200000,
            endAt: 1741881599999,
            unit: 'day',
          },
          groups: [],
        },
        {
          timezone: 'UTC',
        }
      );

      const query = builder.buildClickHouseDateQuery(
        unit,
        maliciousTimezone
      );

      expect(query.sql).not.toContain(maliciousTimezone);
      expect(query.values).toEqual([maliciousTimezone]);
    }
  );

  test('builds complete ClickHouse SQL with a normal timezone', async () => {
    const timezone = 'Asia/Shanghai';
    const builder = new TestWebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: '$all_event',
            math: 'events',
          },
        ],
        filters: [],
        time: {
          startAt: 1739203200000,
          endAt: 1741881599999,
          unit: 'day',
          timezone,
        },
        groups: [],
      },
      {
        timezone: 'UTC',
      }
    );
    let sentQuery: Parameters<typeof clickhouse.query>[0] | undefined;
    const querySpy = vi.spyOn(clickhouse, 'query').mockImplementation(
      async (query) => {
        sentQuery = query;
        return {
          json: async () => ({ data: [] }),
        } as never;
      }
    );

    try {
      await builder.executeQuery(builder.build());
    } finally {
      querySpy.mockRestore();
    }

    expect(sentQuery?.query_params).toMatchObject({
      field0: timezone,
    });
    expect({
      ...sentQuery,
      query: sentQuery?.query.replace(/[ \t]+$/gm, ''),
    }).toMatchSnapshot('clickhouse sql with normal timezone');
  });

  test('groups', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: '$all_event',
            math: 'events',
          },
        ],
        filters: [],
        time: {
          startAt: 1739203200000,
          endAt: 1741881599999,
          unit: 'day',
        },
        groups: [
          {
            value: 'number',
            type: 'number',
          },
        ],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql');
  });

  test('escapes metric aliases as SQL identifiers', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: '$all_event',
            math: 'events',
            alias: 'safe", (SELECT current_database()) as injected --',
          },
        ],
        filters: [],
        time: {
          startAt: 1739203200000,
          endAt: 1741881599999,
          unit: 'day',
        },
        groups: [],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = unwrapSQL(builder.build());
    expect(sql).toContain(
      'as "safe"", (SELECT current_database()) as injected --"'
    );
    expect(sql).not.toContain(
      'as "safe", (SELECT current_database()) as injected --"'
    );
  });

  test('escapes group aliases as SQL identifiers', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: '$all_event',
            math: 'events',
          },
        ],
        filters: [],
        time: {
          startAt: 1739203200000,
          endAt: 1741881599999,
          unit: 'day',
        },
        groups: [
          {
            value: 'depth", (SELECT current_database()) as injected --',
            type: 'number',
          },
        ],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = unwrapSQL(builder.build());
    expect(sql).toContain(
      'as "%depth"", (SELECT current_database()) as injected --"'
    );
    expect(sql).not.toContain(
      'as "%depth", (SELECT current_database()) as injected --"'
    );
  });

  test('groups with custom bucket', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: '$all_event',
            math: 'events',
          },
        ],
        filters: [],
        time: {
          startAt: 1739203200000,
          endAt: 1741881599999,
          unit: 'day',
        },
        groups: [
          {
            value: 'number',
            type: 'number',
            customGroups: [
              {
                filterOperator: 'not equals',
                filterValue: 1,
              },
            ],
          },
        ],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql');
  });

  test('with filters', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: '$all_event',
            math: 'events',
          },
        ],
        filters: [
          {
            name: 'country',
            type: 'string',
            operator: 'equals',
            value: 'US',
          },
          {
            name: 'age',
            type: 'number',
            operator: 'greater than',
            value: 18,
          },
        ],
        time: {
          startAt: 1739203200000,
          endAt: 1741881599999,
          unit: 'day',
        },
        groups: [],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql with filters');
  });

  test('different metrics', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: '$page_view',
            math: 'events',
          },
          {
            name: 'click',
            math: 'events',
          },
          {
            name: '$all_event',
            math: 'sessions',
          },
        ],
        filters: [],
        time: {
          startAt: 1739203200000,
          endAt: 1741881599999,
          unit: 'day',
        },
        groups: [],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql with different metrics');
  });

  test('different time units', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: '$all_event',
            math: 'events',
          },
        ],
        filters: [],
        time: {
          startAt: 1739203200000,
          endAt: 1741881599999,
          unit: 'month',
        },
        groups: [],
      },
      {
        timezone: 'Asia/Shanghai',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql with month time unit');
  });

  test('combined filters and groups', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: '$all_event',
            math: 'events',
          },
        ],
        filters: [
          {
            name: 'isNew',
            type: 'boolean',
            operator: 'equals',
            value: 1,
          },
        ],
        time: {
          startAt: 1739203200000,
          endAt: 1741881599999,
          unit: 'day',
        },
        groups: [
          {
            value: 'browser',
            type: 'string',
          },
        ],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql with filters and groups');
  });

  test('date type filters', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: '$all_event',
            math: 'events',
          },
        ],
        filters: [
          {
            name: 'registeredAt',
            type: 'date',
            operator: 'between',
            value: [1739203200000, 1741881599999],
          },
        ],
        time: {
          startAt: 1739203200000,
          endAt: 1741881599999,
          unit: 'day',
        },
        groups: [],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql with date filters');
  });
});
