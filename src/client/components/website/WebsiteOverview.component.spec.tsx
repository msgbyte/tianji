import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpLink } from '@trpc/client';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { trpc } from '@/api/trpc';
import { useGlobalRangeDate } from '@/hooks/useGlobalRangeDate';
import { DateRange, useGlobalStateStore } from '@/store/global';
import { WebsiteOverview } from './WebsiteOverview';
import { WebsiteEventAnalysis } from './WebsiteEventAnalysis';

const mocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/api/model/user', () => ({ getUserTimezone: () => 'UTC' }));
vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace-1',
}));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('sonner', () => ({ toast: mocks }));
vi.mock('../DateFilter', () => ({ DateFilter: () => null }));
vi.mock('../monitor/MonitorHealthBar', () => ({
  MonitorHealthBar: () => null,
}));
vi.mock('../chart/TimeEventChart', () => ({
  TimeEventChart: ({ data }: { data: unknown }) => (
    <output aria-label="Chart data">{JSON.stringify(data)}</output>
  ),
  useTimeEventChartConfig: () => ({}),
}));

const scope = { workspaceId: 'workspace-1', websiteId: 'website-1' };

function RelatedData() {
  const { startDate, endDate } = useGlobalRangeDate();
  const time = {
    startAt: startDate.unix() * 1000,
    endAt: endDate.unix() * 1000,
  };
  const metrics = trpc.website.metrics.useQuery({
    ...scope,
    ...time,
    type: 'url',
  });
  const sidebar = trpc.website.allOverview.useQuery({
    workspaceId: scope.workspaceId,
  });
  trpc.website.retention.useQuery({ ...scope, ...time });
  trpc.website.metrics.useQuery({
    ...scope,
    ...time,
    websiteId: 'website-2',
    type: 'url',
  });

  return (
    <>
      <output aria-label="Page views">{metrics.data?.[0]?.y}</output>
      <output aria-label="Sidebar count">{sidebar.data?.['website-1']}</output>
      <output aria-label="Range end">{time.endAt}</output>
    </>
  );
}

function setup() {
  let value = 1;
  let eventName = 'signup';
  let sidebarRequest: (() => Promise<unknown>) | undefined;
  const requests = vi.fn(async (path: string, input: any) => {
    switch (path) {
      case 'website.allOverview':
        return sidebarRequest ? sidebarRequest() : { 'website-1': value };
      case 'website.metrics':
        return [{ x: input.type === 'event' ? eventName : '/page', y: value }];
      case 'website.retention':
        return [];
      case 'website.stats':
        return Object.fromEntries(
          ['pageviews', 'uniques', 'bounces', 'totaltime'].map((key) => [
            key,
            { value, prev: 0 },
          ])
        );
      case 'website.onlineCount':
        return value;
      case 'insights.query':
        return input.metrics.map((metric: { name: string; alias: string }) => ({
          ...metric,
          data: [
            {
              date: dayjs(input.time.startAt).format('YYYY-MM-DD HH:00:00'),
              value,
            },
          ],
        }));
      default:
        throw new Error(`Unexpected query: ${path}`);
    }
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const client = trpc.createClient({
    links: [
      httpLink({
        url: 'http://localhost/trpc',
        fetch: async (url) => {
          const { pathname, searchParams } = new URL(String(url));
          const data = await requests(
            pathname.split('/').pop()!,
            JSON.parse(searchParams.get('input') ?? '{}')
          );
          return new Response(JSON.stringify({ result: { data } }), {
            headers: { 'content-type': 'application/json' },
          });
        },
      }),
    ],
  });

  render(
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={client} queryClient={queryClient}>
        <WebsiteOverview
          website={{ id: scope.websiteId, ...scope, name: 'Website' } as any}
        />
        <RelatedData />
        <WebsiteEventAnalysis websiteId={scope.websiteId} />
      </trpc.Provider>
    </QueryClientProvider>
  );

  return {
    requests,
    changeData: () => {
      value = 2;
    },
    setSidebarRequest: (request: () => Promise<unknown>) => {
      sidebarRequest = request;
    },
    setEventName: (name: string) => {
      eventName = name;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-07-10T12:30:00Z'));
  useGlobalStateStore.setState(useGlobalStateStore.getInitialState(), true);
  useGlobalStateStore.setState({ dateRange: DateRange.Today });
});
afterEach(() => vi.useRealTimers());

async function waitForInitialData() {
  await waitFor(() => {
    expect(screen.getByLabelText('Page views')).toHaveTextContent('1');
    expect(screen.getByLabelText('Sidebar count')).toHaveTextContent('1');
    expect(screen.getAllByLabelText('Chart data')).toHaveLength(2);
    expect(screen.getAllByLabelText('Chart data')[1]).toHaveTextContent(
      '"value":1'
    );
  });
}

function clickRefresh() {
  fireEvent.click(screen.getByRole('button', { name: /sync|Refresh/i }));
}

describe('WebsiteOverview refresh', () => {
  test('updates metrics, event charts, retention and the sidebar for the current website', async () => {
    const { requests, changeData } = setup();
    await waitForInitialData();
    requests.mockClear();
    changeData();
    clickRefresh();

    await waitFor(() => {
      expect(screen.getByLabelText('Page views')).toHaveTextContent('2');
      expect(screen.getByLabelText('Sidebar count')).toHaveTextContent('2');
      expect(screen.getAllByLabelText('Chart data')[0]).toHaveTextContent(
        '"pv":2'
      );
      expect(screen.getAllByLabelText('Chart data')[1]).toHaveTextContent(
        '"value":2'
      );
      expect(mocks.success).toHaveBeenCalledWith('Refreshed');
    });
    expect(requests).toHaveBeenCalledWith(
      'website.retention',
      expect.objectContaining(scope)
    );
    expect(
      requests.mock.calls.some(([, input]) => input.websiteId === 'website-2')
    ).toBe(false);
  });

  test('advances the rolling range in sibling components and the event chart', async () => {
    useGlobalStateStore.setState({ dateRange: DateRange.Last24Hours });
    const { requests } = setup();
    await waitForInitialData();
    requests.mockClear();
    vi.setSystemTime(new Date('2026-07-10T14:30:00Z'));
    clickRefresh();

    await waitFor(() => {
      expect(screen.getByLabelText('Range end')).toHaveTextContent(
        '1783693800000'
      );
      expect(requests).toHaveBeenCalledWith(
        'website.metrics',
        expect.objectContaining({ ...scope, type: 'url', endAt: 1783693800000 })
      );
      expect(requests).toHaveBeenCalledWith(
        'insights.query',
        expect.objectContaining({
          metrics: [{ name: 'signup', math: 'events', alias: 'signup' }],
          time: expect.objectContaining({ endAt: 1783695599999 }),
        })
      );
    });
  });

  test('waits for the sidebar before reporting refresh success', async () => {
    const { setSidebarRequest } = setup();
    await waitForInitialData();
    let resolveSidebar!: (value: unknown) => void;
    setSidebarRequest(
      () => new Promise((resolve) => (resolveSidebar = resolve))
    );
    clickRefresh();

    await waitFor(() => expect(resolveSidebar).toBeTypeOf('function'));
    expect(mocks.success).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: /sync|Refresh/i })
    ).toBeDisabled();
    await act(async () => resolveSidebar({ 'website-1': 2 }));
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith('Refreshed')
    );
  });

  test('does not report success when a related query fails', async () => {
    const { setSidebarRequest } = setup();
    await waitForInitialData();
    setSidebarRequest(async () => {
      throw new Error('Sidebar unavailable');
    });
    clickRefresh();

    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(mocks.success).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: /sync|Refresh/i })
    ).not.toBeDisabled();
  });

  test.each(['hour', 'event list'])(
    'waits for the event chart when the %s changes',
    async (change) => {
      const { requests, changeData, setEventName } = setup();
      await waitForInitialData();
      const respond = requests.getMockImplementation()!;
      const eventName = change === 'event list' ? 'purchase' : 'signup';
      let finishChart!: () => void;
      requests.mockImplementation(async (path, input) => {
        if (path === 'insights.query' && input.metrics[0].name === eventName) {
          await new Promise<void>((resolve) => (finishChart = resolve));
        }
        return respond(path, input);
      });
      changeData();
      if (change === 'hour') {
        vi.setSystemTime(new Date('2026-07-10T14:30:00Z'));
      } else {
        setEventName('purchase');
      }
      clickRefresh();

      await waitFor(() => expect(finishChart).toBeTypeOf('function'));
      expect(mocks.success).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: /sync|Refresh/i })
      ).toBeDisabled();
      await act(async () => finishChart());
      await waitFor(() => {
        expect(mocks.success).toHaveBeenCalledWith('Refreshed');
        expect(screen.getAllByLabelText('Chart data')[1]).toHaveTextContent(
          '"value":2'
        );
        expect(
          screen.getByRole('button', { name: /sync|Refresh/i })
        ).not.toBeDisabled();
      });
    }
  );

  test('reports failure when the event chart request after the event list fails', async () => {
    const { requests } = setup();
    await waitForInitialData();
    const respond = requests.getMockImplementation()!;
    let failChart!: () => void;
    requests.mockImplementation(async (path, input) => {
      if (path === 'insights.query' && input.metrics[0].name === 'signup') {
        await new Promise<void>((_, reject) => {
          failChart = () => reject(new Error('Event chart unavailable'));
        });
      }
      return respond(path, input);
    });
    vi.setSystemTime(new Date('2026-07-10T14:30:00Z'));
    clickRefresh();

    await waitFor(() => expect(failChart).toBeTypeOf('function'));
    await act(async () => failChart());
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith('Failed to refresh')
    );
    expect(mocks.success).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: /sync|Refresh/i })
    ).not.toBeDisabled();
  });

  test('finishes without requesting a chart when no named events remain', async () => {
    const { requests, setEventName } = setup();
    await waitForInitialData();
    requests.mockClear();
    setEventName('');
    clickRefresh();

    await waitFor(() => {
      expect(mocks.success).toHaveBeenCalledWith('Refreshed');
      expect(screen.getByText('No event data yet')).toBeInTheDocument();
    });
    expect(screen.getAllByLabelText('Chart data')).toHaveLength(1);
    expect(
      requests.mock.calls.filter(
        ([path, input]) =>
          path === 'insights.query' && input.metrics[0].name !== '$page_view'
      )
    ).toHaveLength(0);
  });
});
