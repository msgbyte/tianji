import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { INIT_WORKSPACE_ID } from '../../../utils/const.js';
import { env } from '../../../utils/env.js';
import { queryWarehouseEvents } from './index.js';
import { clearWarehouseApplicationsCache } from './utils.js';

describe('queryWarehouseEvents', () => {
  const originalApplicationsJson = env.insights.warehouse.applicationsJson;

  beforeAll(() => {
    env.insights.warehouse.applicationsJson = JSON.stringify([
      {
        name: 'wide',
        type: 'wideTable',
        tableName: 'events',
        fields: [],
        distinctField: 'user_id',
        createdAtField: 'created_at',
      },
      {
        name: 'long',
        type: 'longTable',
        eventTable: {
          name: 'events',
          eventNameField: 'event_name',
          createdAtField: 'created_at',
        },
        eventParametersTable: {
          name: 'event_parameters',
          eventNameField: 'event_name',
          paramsNameField: 'key',
          paramsValueField: 'value',
          createdAtField: 'created_at',
        },
      },
    ]);
    clearWarehouseApplicationsCache(INIT_WORKSPACE_ID);
  });

  afterAll(() => {
    env.insights.warehouse.applicationsJson = originalApplicationsJson;
    clearWarehouseApplicationsCache(INIT_WORKSPACE_ID);
  });

  test.each(['wide', 'long'])('initializes %s table events query', async (id) => {
    await expect(
      queryWarehouseEvents(
        {
          workspaceId: INIT_WORKSPACE_ID,
          insightId: id,
          insightType: 'warehouse',
          metrics: [{ name: '$all_event', math: 'events' }],
          filters: [],
          groups: [],
          limit: 100,
          time: {
            startAt: 1753977600000,
            endAt: 1754668799999,
            unit: 'day',
          },
        },
        { timezone: 'UTC' }
      )
    ).rejects.toThrow('Database url is not set');
  });
});
