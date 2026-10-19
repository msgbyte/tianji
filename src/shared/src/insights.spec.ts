import { describe, expect, test } from 'vitest';
import { processGroupedTimeSeriesData } from './insights';

describe('processGroupedTimeSeriesData', () => {
  test('preserves each complete group combination across dates and metrics', () => {
    const rows = [
      {
        date: '2026-10-01',
        '%$country': 'ES',
        '%$browser': 'chrome',
        $page_view: 2,
        users: 1,
      },
      {
        date: '2026-10-01',
        '%$country': 'ES',
        '%$browser': 'firefox',
        $page_view: 1,
        users: 1,
      },
      {
        date: '2026-10-02',
        '%$country': 'ES',
        '%$browser': 'chrome',
        $page_view: 3,
        users: 2,
      },
    ];
    const result = processGroupedTimeSeriesData(
      {
        time: {
          startAt: Date.parse('2026-10-01T00:00:00Z'),
          endAt: Date.parse('2026-10-02T23:59:59Z'),
          unit: 'day',
          timezone: 'UTC',
        },
        metrics: [
          { name: '$page_view' },
          { name: '$page_view', alias: 'users' },
        ],
        groups: [{ value: '$country' }, { value: '$browser' }],
      },
      { timezone: 'UTC' },
      rows
    );

    expect(result).toMatchObject([
      {
        $country: 'ES',
        $browser: 'chrome',
        data: [{ value: 2 }, { value: 3 }],
      },
      {
        $country: 'ES',
        $browser: 'firefox',
        data: [{ value: 1 }, { value: 0 }],
      },
      {
        $country: 'ES',
        $browser: 'chrome',
        alias: 'users',
        data: [{ value: 1 }, { value: 2 }],
      },
      {
        $country: 'ES',
        $browser: 'firefox',
        alias: 'users',
        data: [{ value: 1 }, { value: 0 }],
      },
    ]);
  });
});
