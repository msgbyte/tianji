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
});
