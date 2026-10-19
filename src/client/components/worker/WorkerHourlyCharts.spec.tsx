import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { WorkerHourlyCharts } from './WorkerHourlyCharts';

const queryState = vi.hoisted(() => ({
  data: undefined as unknown[] | undefined,
  isLoading: false,
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api/trpc', () => ({
  trpc: {
    worker: {
      getExecutionHourlyStats: {
        useQuery: vi.fn(() => ({
          data: queryState.data,
          isLoading: queryState.isLoading,
        })),
      },
    },
  },
}));

vi.mock('@/components/chart/TimeEventChart', () => ({
  TimeEventChart: () => <div data-testid="time-event-chart" />,
}));

describe('WorkerHourlyCharts', () => {
  beforeEach(() => {
    queryState.data = undefined;
    queryState.isLoading = false;
  });

  afterEach(() => {
    cleanup();
  });

  test('does not show the empty state before hourly stats finish loading', () => {
    queryState.isLoading = true;

    render(<WorkerHourlyCharts workspaceId="workspace_1" workerId="worker_1" />);

    expect(
      screen.queryByText('No execution data in the last 24 hours')
    ).not.toBeInTheDocument();
  });

  test('shows the empty state after hourly stats load with no rows', () => {
    queryState.data = [];

    render(<WorkerHourlyCharts workspaceId="workspace_1" workerId="worker_1" />);

    expect(
      screen.getByText('No execution data in the last 24 hours')
    ).toBeInTheDocument();
  });
});
