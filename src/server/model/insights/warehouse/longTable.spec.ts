import { beforeAll, describe, expect, test } from 'vitest';
import { WarehouseLongTableInsightsSqlBuilder } from './longTable.js';
import { unwrapSQL } from '../../../utils/prisma.js';
import dayjs from 'dayjs';
import { env } from '../../../utils/env.js';

describe('WarehouseInsightsSqlBuilder', () => {
  const insightId = 'test'; // application name
  const insightType = 'warehouse';

  beforeAll(() => {
    env.insights.warehouse.applicationsJson = JSON.stringify([
      {
        name: 'test',
        eventTable: {
          name: 'events',
          eventNameField: 'event_name',
          createdAtField: 'event_timestamp',
        },
        eventParametersTable: {
          name: 'event_parameters',
          eventNameField: 'event_name',
          paramsNameField: 'event_param_key',
          paramsValueField: 'event_param_value',
          createdAtField: 'event_timestamp',
        },
      },
    ]);
  });

  test('default', () => {
    const builder = new WarehouseLongTableInsightsSqlBuilder(
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

  test('with filter', () => {
    const builder = new WarehouseLongTableInsightsSqlBuilder(
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
            name: 'name',
            value: 'value',
            operator: 'equals',
            type: 'string',
          },
        ],
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

  test.todo('buildFetchEventsQuery');
});
