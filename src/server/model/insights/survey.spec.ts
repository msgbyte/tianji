import { describe, expect, test } from 'vitest';
import { SurveyInsightsSqlBuilder } from './survey.js';
import { unwrapSQL } from '../../utils/prisma.js';

describe('SurveyInsightsSqlBuilder', () => {
  const insightId = 'cm658i2tqw96upkejldn8rpbs';
  const insightType = 'survey';

  test('groups', () => {
    const builder = new SurveyInsightsSqlBuilder(
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
            value: 'rating',
            type: 'string',
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
    const builder = new SurveyInsightsSqlBuilder(
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
            value: 'rating',
            type: 'string',
            customGroups: [
              {
                filterOperator: 'in list',
                filterValue: ['1', '2', '3'],
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
    const builder = new SurveyInsightsSqlBuilder(
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
    const builder = new SurveyInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: 'rating',
            math: 'events',
          },
          {
            name: 'comment',
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
    const builder = new SurveyInsightsSqlBuilder(
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
    const builder = new SurveyInsightsSqlBuilder(
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
            name: 'completed',
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
            value: 'userType',
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
    const builder = new SurveyInsightsSqlBuilder(
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
            name: 'submittedAt',
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

  test('multiple string filters', () => {
    const builder = new SurveyInsightsSqlBuilder(
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
            name: 'source',
            type: 'string',
            operator: 'contains',
            value: 'web',
          },
          {
            name: 'feedback',
            type: 'string',
            operator: 'not contains',
            value: 'bug',
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
    expect(unwrapSQL(sql)).toMatchSnapshot('sql with multiple string filters');
  });

  test('numeric filters with ranges', () => {
    const builder = new SurveyInsightsSqlBuilder(
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
            name: 'score',
            type: 'number',
            operator: 'between',
            value: [7, 10],
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
    expect(unwrapSQL(sql)).toMatchSnapshot('sql with numeric range filter');
  });
});
