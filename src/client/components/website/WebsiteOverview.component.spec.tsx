import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { describe, expect, test, vi } from 'vitest';
import { WebsiteOverview } from './WebsiteOverview';

const mocks = vi.hoisted(() => ({
  invalidateRetention: vi.fn(async () => undefined),
  refetchPageview: vi.fn(async () => undefined),
  refetchStats: vi.fn(async () => undefined),
  refresh: vi.fn(),
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api/model/user', () => ({
  getUserTimezone: () => 'UTC',
}));

vi.mock('@/api/trpc', () => ({
  trpc: {
    useUtils: () => ({
      website: {
        retention: { invalidate: mocks.invalidateRetention },
      },
    }),
    insights: {
      query: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          refetch: mocks.refetchPageview,
        }),
      },
    },
    website: {
      stats: {
        useQuery: () => ({
          data: undefined,
          isLoading: false,
          refetch: mocks.refetchStats,
        }),
      },
    },
  },
}));

vi.mock('@/hooks/useGlobalRangeDate', () => ({
  useGlobalRangeDate: () => ({
    startDate: dayjs('2026-07-01T00:00:00'),
    endDate: dayjs('2026-07-31T23:59:59'),
    unit: 'day',
    refresh: mocks.refresh,
  }),
}));

vi.mock('@/hooks/useEvent', () => ({
  useEvent: (callback: unknown) => callback,
}));

vi.mock('@/store/global', () => ({
  useGlobalStateStore: Object.assign(
    (selector: (state: { showPreviousPeriod: boolean }) => unknown) =>
      selector({ showPreviousPeriod: false }),
    { setState: vi.fn() }
  ),
}));

vi.mock('antd', () => ({
  Button: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>refresh</button>
  ),
  Switch: () => null,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('../DateFilter', () => ({ DateFilter: () => null }));
vi.mock('../MetricCard', () => ({ MetricCard: () => null }));
vi.mock('../chart/TimeEventChart', () => ({ TimeEventChart: () => null }));
vi.mock('../LoadingView', () => ({
  LoadingView: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('../monitor/MonitorHealthBar', () => ({
  MonitorHealthBar: () => null,
}));
vi.mock('./WebsiteOnlineCount', () => ({ WebsiteOnlineCount: () => null }));

describe('WebsiteOverview', () => {
  test('refreshes the retention query with the overview', async () => {
    render(
      <WebsiteOverview
        website={
          {
            id: 'website-1',
            workspaceId: 'workspace-1',
            name: 'Website',
          } as any
        }
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));

    await waitFor(() =>
      expect(mocks.invalidateRetention).toHaveBeenCalledWith({
        workspaceId: 'workspace-1',
        websiteId: 'website-1',
      })
    );
  });
});
