import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildRetentionQuery } from './retention.js';
import { unwrapSQL } from '../../../utils/prisma.js';
import dayjs from 'dayjs';
import { env } from '../../../utils/env.js';
import { INIT_WORKSPACE_ID } from '../../../utils/const.js';
import { clearWarehouseApplicationsCache } from './utils.js';

describe('retention', () => {
  const originalApplicationsJson = env.insights.warehouse.applicationsJson;
  const originalUserApplicationId =
    env.insights.warehouse.retention.userApplicationId;

  beforeAll(() => {
    env.insights.warehouse.applicationsJson = JSON.stringify([
      {
        name: 'wide_table_test',
        type: 'wideTable',
        tableName: 'events',
        fields: [],
        distinctField: 'user_id',
        createdAtField: 'event_timestamp',
      },
      {
        name: 'users',
        type: 'wideTable',
        tableName: 'users',
        fields: [],
        distinctField: 'user_id',
        createdAtField: 'created_at',
      },
    ]);
    env.insights.warehouse.retention.userApplicationId = 'users';
    clearWarehouseApplicationsCache(INIT_WORKSPACE_ID);
  });

  afterAll(() => {
    env.insights.warehouse.applicationsJson = originalApplicationsJson;
    env.insights.warehouse.retention.userApplicationId =
      originalUserApplicationId;
    clearWarehouseApplicationsCache(INIT_WORKSPACE_ID);
  });

  describe('buildRetentionQuery', () => {
    it('base', async () => {
      const query = await buildRetentionQuery(
        INIT_WORKSPACE_ID,
        'wide_table_test',
        dayjs('2025-07-15').valueOf(),
        dayjs('2025-08-02').valueOf()
      );

      expect(unwrapSQL(query)).toContain('LEFT JOIN "events" AS "e"');
    });
  });
});
