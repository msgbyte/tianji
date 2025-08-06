import { describe, expect, test } from 'vitest';
import { AIGatewayInsightsSqlBuilder } from './aiGateway.js';
import { unwrapSQL } from '../../utils/prisma.js';

describe('AIGatewayInsightsSqlBuilder', () => {
  const insightId = 'cm95r56tv001gqhzlrxeyi6jm';
  const insightType = 'aigateway';

  test('basic query count', () => {
    const builder = new AIGatewayInsightsSqlBuilder(
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
          endAt: 1744273003917,
          unit: 'day',
        },
        groups: [],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('basic query count');
  });

  test('basic query inputToken', () => {
    const builder = new AIGatewayInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: 'inputToken',
            math: 'events',
          },
        ],
        filters: [],
        time: {
          startAt: 1739203200000,
          endAt: 1744273003917,
          unit: 'day',
        },
        groups: [],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = builder.build();
    expect(unwrapSQL(sql)).toMatchSnapshot('basic query inputToken');
  });
});
