import React from 'react';
import { render } from '@testing-library/react';
import dayjs from 'dayjs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { WebsiteRetention } from './WebsiteRetention';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@i18next-toolkit/react', () => ({
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

vi.mock('antd', () => ({
  Table: () => null,
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  theme: { useToken: () => ({ token: { colorPrimary: '#1677ff' } }) },
}));

describe('WebsiteRetention', () => {
  test('queries complete local days with enough history for mature cohorts', () => {
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

    const completeEnd = dayjs(endAt).subtract(1, 'day').endOf('day');
    expect(mocks.useQuery).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      websiteId: 'website-1',
      startAt: completeEnd.subtract(30, 'day').startOf('day').valueOf(),
      endAt: completeEnd.valueOf(),
      timezone: 'UTC',
    });
  });

  afterEach(() => vi.useRealTimers());
});
