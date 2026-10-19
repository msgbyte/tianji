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

  test('keeps multiple breakdown keys inside the parameter join', async () => {
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
        groups: [
          { value: 'plan', type: 'string' },
          { value: 'country', type: 'string' },
        ],
      },
      {
        timezone: 'UTC',
      }
    );

    await builder.initialize();
    const sql = builder.build();
    expect(unwrapSQL(sql)).toContain(
      `AND ("event_parameters"."event_param_key" = 'plan' OR "event_parameters"."event_param_key" = 'country')`
    );
  });

  test.each(['plan`, (select 1) as `x', 'plan"', 'plan?'])(
    'rejects breakdown key %s that could break out of an identifier',
    async (value) => {
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
          groups: [{ value, type: 'string' }],
        },
        {
          timezone: 'UTC',
        }
      );

      await builder.initialize();
      expect(() => builder.build()).toThrow('Invalid warehouse identifier');
    }
  );

  test('rejects metric aliases that could break out of an identifier', async () => {
    const builder = new WarehouseLongTableInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: INIT_WORKSPACE_ID,
        metrics: [
          {
            name: '$all_event',
            math: 'events',
            alias: 'x`, (select 1) as `y',
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
    expect(() => builder.build()).toThrow('Invalid warehouse identifier');
  });

  test('keeps joined parameter fields when fetching filtered events', async () => {
    const builder = new WarehouseLongTableInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: INIT_WORKSPACE_ID,
        metrics: [{ name: '$all_event', math: 'events' }],
        filters: [
          { name: 'plan', value: 'pro', operator: 'equals', type: 'string' },
        ],
        groups: [],
        time: {
          startAt: dayjs('2025-08-01').valueOf(),
          endAt: dayjs('2025-08-02').valueOf(),
          unit: 'day',
        },
      },
      { timezone: 'UTC' }
    );
    await builder.initialize();

    const query = unwrapSQL(builder.buildFetchEventsQuery(undefined));
    expect(query).toMatch(/select\s+\*,/);
    expect(query).toContain('INNER JOIN "event_parameters"');
    expect(query).toContain('"events"."event_timestamp" as "createdAt"');
  });
});
