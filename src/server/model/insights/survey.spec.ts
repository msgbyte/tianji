import { describe, expect, test } from 'vitest';
import { buildInsightsSurvey } from './survey.js';
import { unwrapSQL } from '../../utils/prisma.js';

describe('buildInsightsSurvey', () => {
  const insightId = 'cm658i2tqw96upkejldn8rpbs';
  const insightType = 'survey';

  test('groups', () => {
    const sql = buildInsightsSurvey(
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
          },
        ],
      },
      {
        timezone: 'UTC',
      }
    );

    expect(unwrapSQL(sql)).toMatchSnapshot('sql');
  });

  test('groups with custom bucket', () => {
    const sql = buildInsightsSurvey(
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

    expect(unwrapSQL(sql)).toMatchSnapshot('sql');
  });
});
