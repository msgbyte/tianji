import { describe, expect, test } from 'vitest';
import { unwrapSQL } from '../../utils/prisma.js';
import { WebsiteInsightsSqlBuilder } from './website.js';

describe('WebsiteInsightsSqlBuilder', () => {
  const insightId = 'cly5yay7a001v5tp6xdkzmygh';
  const insightType = 'website';

  test('groups', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
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

  test('groups with custom bucket', () => {
    const builder = new WebsiteInsightsSqlBuilder(
      {
        insightId,
        insightType,
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
});
