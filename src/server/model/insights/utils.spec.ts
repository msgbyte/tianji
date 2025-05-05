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
});
