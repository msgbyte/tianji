import { describe, expect, it } from 'vitest';
import { processInsightsData } from '@/hooks/useInsightsData';

const options = {
  data: [
    {
      name: '$all_event',
      userId: 'user-1',
      data: [{ date: '2026-07-14', value: 3 }],
    },
  ],
  groups: [{ value: 'userId' }],
  time: {
    startAt: new Date('2026-07-14T00:00:00Z').valueOf(),
    endAt: new Date('2026-07-14T23:59:59Z').valueOf(),
    unit: 'day' as const,
  },
};

describe('processInsightsData group labels', () => {
  it('formats grouped series labels without changing values', () => {
    const result = processInsightsData({
      ...options,
      groupValueFormatter: (value) => `Ada (${value})`,
    });

    expect(result.chartData).toEqual([
      { date: '2026-07-14', '$all_event-Ada (user-1)': 3 },
    ]);
    expect(result.chartConfig['$all_event-Ada (user-1)']?.label).toBe(
      '$all_event-Ada (user-1)'
    );
  });

  it('keeps existing grouped series labels without a formatter', () => {
    const result = processInsightsData(options);

    expect(result.chartData).toEqual([
      { date: '2026-07-14', '$all_event-user-1': 3 },
    ]);
  });
});
