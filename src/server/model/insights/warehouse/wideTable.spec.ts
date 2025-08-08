import { beforeAll, describe, expect, test } from 'vitest';
import { WarehouseWideTableInsightsSqlBuilder } from './wideTable.js';
import { unwrapSQL } from '../../../utils/prisma.js';
import dayjs from 'dayjs';
import { env } from '../../../utils/env.js';

describe('WarehouseWideTableInsightsSqlBuilder', () => {
  const insightId = 'wide_table_test';
  const insightType = 'warehouse';

  beforeAll(() => {
    env.insights.warehouse.applicationsJson = JSON.stringify([
      {
        name: 'wide_table_test',
        type: 'wideTable',
        tableName: 'events',
        fields: [
          {
            name: 'event_name',
            type: 'string',
          },
        ],
        distinctField: 'user_id',
        createdAtField: 'event_timestamp',
        dateBasedCreatedAtField: 'event_date',
      },
    ]);
  });

  test('default', () => {
    const builder = new WarehouseWideTableInsightsSqlBuilder(
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
          startAt: dayjs('2025-08-01').valueOf(),
          endAt: dayjs('2025-08-02').valueOf(),
          unit: 'day',
        },
        groups: [],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql');
  });

  test('group by', () => {
    const builder = new WarehouseWideTableInsightsSqlBuilder(
      {
        workspaceId: '',
        insightId: 'wide_table_test',
        insightType: 'warehouse',
        metrics: [
          {
            math: 'events',
            name: '$all_event',
          },
        ],
        filters: [],
        groups: [
          {
            value: 'is_public',
            type: 'string',
          },
        ],
        time: {
          startAt: 1753977600000,
          endAt: 1754668799999,
          unit: 'day',
          timezone: 'Asia/Shanghai',
        },
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql');
  });

  test('buildFetchEventsQuery', () => {
    const builder = new WarehouseWideTableInsightsSqlBuilder(
      {
        workspaceId: '',
        insightId: 'wide_table_test',
        insightType: 'warehouse',
        metrics: [
          {
            math: 'events',
            name: '$all_event',
          },
        ],
        filters: [],
        groups: [
          {
            value: 'is_public',
            type: 'string',
          },
        ],
        time: {
          startAt: 1753977600000,
          endAt: 1754668799999,
          unit: 'day',
          timezone: 'Asia/Shanghai',
        },
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.buildFetchEventsQuery(undefined);
    expect(unwrapSQL(sql)).toMatchSnapshot('sql');
  });
});
