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

  test('basic query tpot percentile excludes invalid values', () => {
    const builder = new AIGatewayInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: 'tpot',
            math: 'p90',
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

    const sql = unwrapSQL(builder.build());
    expect(sql).toContain('PERCENTILE_CONT(0.9)');
    expect(sql).toContain('ORDER BY "AIGatewayLogs"."tpot"');
    expect(sql).toContain(
      'FILTER (WHERE "AIGatewayLogs"."tpot" > -1) AS "tpot"'
    );
    expect(sql).not.toContain(
      'AND "AIGatewayLogs"."tpot" > -1\n      group by'
    );
    expect(sql).toMatchSnapshot('basic query tpot p90');
  });

  test('basic query tpot avg excludes invalid values', () => {
    const builder = new AIGatewayInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: 'tpot',
            math: 'avg',
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

    const sql = unwrapSQL(builder.build());
    expect(sql).toContain(
      'AVG("AIGatewayLogs"."tpot") FILTER (WHERE "AIGatewayLogs"."tpot" > -1) as "tpot"'
    );
    expect(sql).not.toContain(
      'AND "AIGatewayLogs"."tpot" > -1\n      group by'
    );
    expect(sql).toMatchSnapshot('basic query tpot avg');
  });

  test('mixed query keeps tpot invalid values scoped to tpot aggregate', () => {
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
          {
            name: 'tpot',
            math: 'avg',
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

    const sql = unwrapSQL(builder.build());
    expect(sql).toContain('count(1) as "$all_event"');
    expect(sql).toContain(
      'AVG("AIGatewayLogs"."tpot") FILTER (WHERE "AIGatewayLogs"."tpot" > -1) as "tpot"'
    );
    expect(sql).toContain(
      `where "AIGatewayLogs"."gatewayId" = '${insightId}' AND "AIGatewayLogs"."createdAt" between '2025-02-10T16:00:00.000Z'::timestamptz and '2025-04-10T08:16:43.917Z'::timestamptz\n      group by`
    );
    expect(sql).not.toContain(
      'AND "AIGatewayLogs"."tpot" > -1\n      group by'
    );
    expect(sql).toMatchSnapshot('mixed query count and tpot avg');
  });

  test('unsupported avg and percentile metric names are ignored', () => {
    const builder = new AIGatewayInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: 'badAvgMetric',
            math: 'avg',
          },
          {
            name: 'badPercentileMetric',
            math: 'p90',
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

    expect(builder.buildSelectQueryArr()).toEqual([null, null]);
  });
});
