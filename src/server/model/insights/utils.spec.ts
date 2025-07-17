import { describe, expect, test } from 'vitest';
import { processGroupedTimeSeriesData } from './utils.js';

describe('processGroupedTimeSeriesData', () => {
  test('simple test case', () => {
    const query = {
      workspaceId: 'clnzoxcy10001vy2ohi4obbi0',
      insightId: 'cma0pdi2w6j5n1xy5y9qez5zc',
      insightType: 'website' as const,
      metrics: [{ name: '$all_event', math: 'sessions' as const }],
      filters: [],
      groups: [{ value: 'depth', type: 'number' as const }],
      time: {
        startAt: 1745769600000,
        endAt: 1746460799999,
        unit: 'day' as const,
      },
    };

    // database result
    const data = [
      { date: '2025-04-29', '%depth': 18.0, $all_event: 1 },
      { date: '2025-04-30', '%depth': 1.0, $all_event: 20 },
      { date: '2025-04-30', '%depth': 2.0, $all_event: 11 },
      { date: '2025-04-30', '%depth': 3.0, $all_event: 7 },
      { date: '2025-04-30', '%depth': 4.0, $all_event: 3 },
      { date: '2025-04-30', '%depth': 5.0, $all_event: 3 },
      { date: '2025-04-30', '%depth': 6.0, $all_event: 2 },
      { date: '2025-04-30', '%depth': 7.0, $all_event: 2 },
      { date: '2025-04-30', '%depth': 8.0, $all_event: 1 },
      { date: '2025-04-30', '%depth': 9.0, $all_event: 1 },
      { date: '2025-05-01', '%depth': 1.0, $all_event: 1 },
      { date: '2025-05-01', '%depth': 2.0, $all_event: 1 },
      { date: '2025-05-01', '%depth': 3.0, $all_event: 1 },
      { date: '2025-05-02', '%depth': 1.0, $all_event: 4 },
      { date: '2025-05-02', '%depth': 2.0, $all_event: 1 },
      { date: '2025-05-02', '%depth': 3.0, $all_event: 1 },
    ];

    const result = processGroupedTimeSeriesData(
      query,
      { timezone: 'utc' },
      data
    );

    expect(result).toMatchSnapshot();
  });

  test('simple test case 2', () => {
    process.env.TZ = 'UTC';

    const query = {
      workspaceId: 'clnzoxcy10001vy2ohi4obbi0',
      insightId: 'cm9lh2wca6kvysrpf2c1r7w89',
      insightType: 'aigateway' as const,
      metrics: [{ name: '$all_event', math: 'events' as const }],
      filters: [],
      groups: [],
      time: {
        startAt: 1752681743468,
        endAt: 1752768143468,
        unit: 'hour' as const,
        timezone: 'Asia/Shanghai',
      },
    };

    // database result - hourly data
    const data = [
      { date: '2025-07-18 00:00:00', $all_event: 1 },
      { date: '2025-07-17 23:00:00', $all_event: 30 },
      { date: '2025-07-17 22:00:00', $all_event: 33 },
      { date: '2025-07-17 21:00:00', $all_event: 24 },
      { date: '2025-07-17 20:00:00', $all_event: 26 },
      { date: '2025-07-17 19:00:00', $all_event: 19 },
      { date: '2025-07-17 18:00:00', $all_event: 12 },
      { date: '2025-07-17 17:00:00', $all_event: 16 },
      { date: '2025-07-17 16:00:00', $all_event: 33 },
      { date: '2025-07-17 15:00:00', $all_event: 17 },
      { date: '2025-07-17 14:00:00', $all_event: 26 },
      { date: '2025-07-17 13:00:00', $all_event: 27 },
      { date: '2025-07-17 12:00:00', $all_event: 31 },
      { date: '2025-07-17 11:00:00', $all_event: 45 },
      { date: '2025-07-17 10:00:00', $all_event: 23 },
      { date: '2025-07-17 09:00:00', $all_event: 32 },
      { date: '2025-07-17 08:00:00', $all_event: 28 },
      { date: '2025-07-17 07:00:00', $all_event: 22 },
      { date: '2025-07-17 06:00:00', $all_event: 24 },
      { date: '2025-07-17 05:00:00', $all_event: 29 },
      { date: '2025-07-17 04:00:00', $all_event: 26 },
      { date: '2025-07-17 03:00:00', $all_event: 26 },
      { date: '2025-07-17 02:00:00', $all_event: 22 },
      { date: '2025-07-17 01:00:00', $all_event: 28 },
      { date: '2025-07-17 00:00:00', $all_event: 21 },
    ];

    const result = processGroupedTimeSeriesData(
      query,
      { timezone: 'Asia/Shanghai' },
      data
    );

    expect(result).toMatchSnapshot();
  });
});
