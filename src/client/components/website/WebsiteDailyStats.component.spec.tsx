import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { WebsiteDailyStats } from './WebsiteDailyStats';

const mocks = vi.hoisted(() => ({ useQuery: vi.fn(), renderChart: vi.fn() }));
vi.mock('@i18next-toolkit/react', () => ({
  t: (key: string) => key,
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/api/model/user', () => ({ getUserTimezone: () => 'UTC' }));
vi.mock('@/api/trpc', () => ({
  trpc: { insights: { query: { useQuery: mocks.useQuery } } },
}));
vi.mock('../chart/TimeEventChart', () => ({
  TimeEventChart: (props: unknown) => {
    mocks.renderChart(props);
    return <div>daily-chart</div>;
  },
}));

describe('WebsiteDailyStats', () => {
  const props = {
    workspaceId: 'workspace-1',
    websiteId: 'website-1',
    startAt: dayjs('2026-07-01T12:00:00').valueOf(),
    endAt: dayjs('2026-07-03T12:00:00').valueOf(),
    onOpenChange: vi.fn(),
  };
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(dayjs('2026-07-03T12:00:00').toDate());
    mocks.useQuery.mockReset();
    mocks.renderChart.mockReset();
    mocks.useQuery.mockReturnValue({ data: [], isLoading: false });
  });
  afterEach(() => vi.useRealTimers());

  test('loads only when opened and shows daily counts including zero-activity dates', () => {
    mocks.useQuery.mockReturnValue({
      isLoading: false,
      data: [
        {
          name: '$first_visit',
          alias: 'dnu',
          data: [
            { date: '2026-07-01 00:00:00', value: 2 },
            { date: '2026-07-02 00:00:00', value: 0 },
            { date: '2026-07-03 00:00:00', value: 1 },
          ],
        },
        {
          name: '$page_view',
          alias: 'dau',
          data: [
            { date: '2026-07-01 00:00:00', value: 5 },
            { date: '2026-07-02 00:00:00', value: 0 },
            { date: '2026-07-03 00:00:00', value: 3 },
          ],
        },
      ],
    });
    const { rerender } = render(<WebsiteDailyStats {...props} open={false} />);
    expect(mocks.useQuery).not.toHaveBeenCalled();
    rerender(<WebsiteDailyStats {...props} open />);
    expect(mocks.useQuery).toHaveBeenCalledWith({
      workspaceId: props.workspaceId,
      insightId: props.websiteId,
      insightType: 'website',
      metrics: [
        { name: '$first_visit', math: 'sessions', alias: 'dnu' },
        { name: '$page_view', math: 'sessions', alias: 'dau' },
      ],
      time: {
        startAt: dayjs(props.startAt).startOf('day').valueOf(),
        endAt: dayjs().valueOf(),
        unit: 'day',
        timezone: 'UTC',
      },
      filters: [],
      groups: [],
    });
    expect(mocks.renderChart.mock.lastCall?.[0].data).toEqual([
      { date: '2026-07-01', dnu: 2, dau: 5 },
      { date: '2026-07-02', dnu: 0, dau: 0 },
      { date: '2026-07-03', dnu: 1, dau: 3 },
    ]);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('2026-07-03');
    expect(rows[1]).toHaveTextContent('Partial day');
    expect(rows[3]).toHaveTextContent('2026-07-01');
    expect(
      screen.getByRole('columnheader', { name: 'DNU' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'DAU' })
    ).toBeInTheDocument();
  });

  test('shows query errors with retry instead of zero counts', () => {
    const refetch = vi.fn();
    mocks.useQuery.mockReturnValue({
      isError: true,
      isLoading: false,
      refetch,
    });
    render(<WebsiteDailyStats {...props} open />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load daily user statistics'
    );
    expect(mocks.renderChart).not.toHaveBeenCalled();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
