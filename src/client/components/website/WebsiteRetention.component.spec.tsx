import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { WebsiteRetention } from './WebsiteRetention';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  renderChart: vi.fn(),
}));

vi.mock('@i18next-toolkit/react', () => ({
  t: (key: string) => key,
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api/model/user', () => ({
  getUserTimezone: () => 'UTC',
}));

vi.mock('@/api/trpc', () => ({
  trpc: {
    website: {
      retention: {
        useQuery: mocks.useQuery,
      },
    },
  },
}));

vi.mock('../chart/TimeEventChart', () => ({
  TimeEventChart: (props: unknown) => {
    mocks.renderChart(props);
    return <div>retention-chart</div>;
  },
}));

vi.mock('antd', async (importOriginal) => ({
  ...(await importOriginal<typeof import('antd')>()),
  Empty: () => <div>No data</div>,
  Spin: () => <div>Loading</div>,
}));

describe('WebsiteRetention', () => {
  beforeEach(() => {
    mocks.useQuery.mockReset();
    mocks.useQuery.mockReturnValue({ data: [], isLoading: false });
    mocks.renderChart.mockReset();
  });

  test('loads retention only after opening the dialog', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 30, 12));
    const startAt = dayjs().subtract(1, 'day').valueOf();
    const endAt = dayjs().valueOf();

    render(
      <WebsiteRetention
        workspaceId="workspace-1"
        websiteId="website-1"
        startAt={startAt}
        endAt={endAt}
      />
    );

    expect(mocks.useQuery).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Visitor retention' })
    );

    const completeEnd = dayjs(endAt).subtract(1, 'day').endOf('day');
    expect(mocks.useQuery).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      websiteId: 'website-1',
      startAt: completeEnd.subtract(30, 'day').startOf('day').valueOf(),
      endAt: completeEnd.valueOf(),
      timezone: 'UTC',
    });
  });

  test('plots one retention curve per cohort plus the weighted total', async () => {
    mocks.useQuery.mockReturnValue({
      isLoading: false,
      data: [
        {
          date: '2026-08-01',
          cohortSize: 4,
          d1: 2,
          d3: 1,
          d5: null,
          d7: null,
          d14: null,
        },
        {
          date: '2026-07-31',
          cohortSize: 6,
          d1: 3,
          d3: 3,
          d5: 1,
          d7: 0,
          d14: 0,
        },
      ],
    });

    render(
      <WebsiteRetention
        workspaceId="workspace-1"
        websiteId="website-1"
        startAt={new Date('2026-07-01T00:00:00Z').valueOf()}
        endAt={new Date('2026-08-02T00:00:00Z').valueOf()}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Visitor retention' })
    );

    await waitFor(() => expect(mocks.renderChart).toHaveBeenCalled());
    const props = mocks.renderChart.mock.lastCall?.[0] as {
      chartType: string;
      data: Record<string, number | string>[];
    };

    expect(props.chartType).toBe('line');
    expect(props.data[0]).toEqual({
      date: '0',
      all: 100,
      '2026-08-01': 100,
      '2026-07-31': 100,
    });
    expect(props.data[2]).toEqual({
      date: '3',
      all: 40,
      '2026-08-01': 25,
      '2026-07-31': 50,
    });
    expect(props.data[3]).not.toHaveProperty('2026-08-01');
    expect(props.data[3].all).toBeCloseTo(100 / 6);
  });

  afterEach(() => vi.useRealTimers());
});
