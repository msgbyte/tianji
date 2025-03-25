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

  test('with filters', () => {
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
