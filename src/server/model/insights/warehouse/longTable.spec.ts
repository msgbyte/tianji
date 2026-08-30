import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { WarehouseLongTableInsightsSqlBuilder } from './longTable.js';
import { unwrapSQL } from '../../../utils/prisma.js';
import dayjs from 'dayjs';
import { env } from '../../../utils/env.js';
import { INIT_WORKSPACE_ID } from '../../../utils/const.js';
import { clearWarehouseApplicationsCache } from './utils.js';

describe('WarehouseInsightsSqlBuilder', () => {
  const insightId = 'test'; // application name
  const insightType = 'warehouse';
  const originalApplicationsJson = env.insights.warehouse.applicationsJson;

  beforeAll(() => {
    env.insights.warehouse.applicationsJson = JSON.stringify([
      {
        name: 'test',
        type: 'longTable',
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
    clearWarehouseApplicationsCache(INIT_WORKSPACE_ID);
  });

  afterAll(() => {
    env.insights.warehouse.applicationsJson = originalApplicationsJson;
    clearWarehouseApplicationsCache(INIT_WORKSPACE_ID);
  });

  test('default', async () => {
    const builder = new WarehouseLongTableInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: INIT_WORKSPACE_ID,
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

    await builder.initialize();
    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql');
  });

  test('with filter', async () => {
    const builder = new WarehouseLongTableInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: INIT_WORKSPACE_ID,
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

    await builder.initialize();
    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('sql');
  });

  test.todo('buildFetchEventsQuery');
});
