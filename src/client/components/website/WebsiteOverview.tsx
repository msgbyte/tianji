import { Button, message, Spin, Switch } from 'antd';
import React from 'react';
import { SyncOutlined } from '@ant-design/icons';
import { DateFilter } from '../DateFilter';
import { WebsiteInfo } from '../../api/model/website';
import { getDateArray } from '../../utils/date';
import { useEvent } from '../../hooks/useEvent';
import { MetricCard } from '../MetricCard';
import { formatNumber, formatShortTime } from '../../utils/common';
import { WebsiteOnlineCount } from './WebsiteOnlineCount';
import { useGlobalRangeDate } from '../../hooks/useGlobalRangeDate';
import { MonitorHealthBar } from '../monitor/MonitorHealthBar';
import { AppRouterOutput, trpc } from '../../api/trpc';
import { getUserTimezone } from '../../api/model/user';
import { useGlobalStateStore } from '../../store/global';
import { useTranslation } from '@i18next-toolkit/react';
import { TimeEventChart } from '../chart/TimeEventChart';
import { Link } from '@tanstack/react-router';
import { LoadingView } from '../LoadingView';
import { toast } from 'sonner';

export const WebsiteOverview: React.FC<{
  website: WebsiteInfo;
  showDateFilter?: boolean;
  actions?: React.ReactNode;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const { website, showDateFilter = false, actions } = props;
  const { startDate, endDate, unit, refresh } = useGlobalRangeDate();
  const showPreviousPeriod = useGlobalStateStore(
    (state) => state.showPreviousPeriod
  );

  const {
    data: chartData = [],
    isLoading: isLoadingPageview,
    refetch: refetchPageview,
  } = trpc.insights.query.useQuery(
    {
      workspaceId: website.workspaceId,
      insightId: website.id,
      insightType: 'website',
      metrics: [
        { name: '$page_view', math: 'events', alias: 'A' },
        { name: '$page_view', math: 'sessions', alias: 'B' },
      ],
      filters: [],
      groups: [],
      time: {
        startAt: startDate.valueOf(),
        endAt: endDate.valueOf(),
        unit,
        timezone: getUserTimezone(),
      },
    },
    {
      select(data) {
        const pvSeries = data?.[0]?.data ?? [];
        const uvSeries = data?.[1]?.data ?? [];

        const pvMap = new Map<string, number>(
          pvSeries.map((d) => [d.date, Number(d.value) || 0])
        );
        const uvMap = new Map<string, number>(
          uvSeries.map((d) => [d.date, Number(d.value) || 0])
        );

        const dates: string[] = pvSeries.map((d) => d.date);

        return dates.map((date) => ({
          pv: pvMap.get(date) ?? 0,
          uv: uvMap.get(date) ?? 0,
          date,
        }));
      },
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    }
  );

  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = trpc.website.stats.useQuery(
    {
      workspaceId: website.workspaceId,
      websiteId: website.id,
      startAt: startDate.unix() * 1000,
      endAt: endDate.unix() * 1000,
      timezone: getUserTimezone(),
      unit,
    },
    {
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    }
  );

  const handleRefresh = useEvent(async () => {
    refresh();

    await Promise.all([refetchPageview(), refetchStats()]);

    toast.success(t('Refreshed'));
  });

  const loading = isLoadingPageview || isLoadingStats;

  return (
    <LoadingView isLoading={loading}>
      <div className="flex flex-col-reverse sm:flex-row">
        <div className="flex flex-1 flex-col gap-2 text-2xl font-bold sm:flex-row sm:items-center">
          <span className="mr-2" title={website.domain ?? ''}>
            {website.name}
          </span>

          {website.monitorId && (
            <Link
              className="w-20 cursor-pointer"
              to="/monitor/$monitorId"
              params={{ monitorId: website.monitorId }}
            >
              <MonitorHealthBar
                workspaceId={website.workspaceId}
                monitorId={website.monitorId}
              />
            </Link>
          )}

          <div className="text-base font-normal">
            <WebsiteOnlineCount
              workspaceId={website.workspaceId}
              websiteId={website.id}
            />
          </div>
        </div>

        <div>{actions}</div>
      </div>

      <div className="mb-10 flex flex-wrap justify-between">
        <div className="flex-1">{stats && <MetricsBar stats={stats} />}</div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-1/3">
          <div className="mr-2">
            <Switch
              checked={showPreviousPeriod}
              onChange={(checked) =>
                useGlobalStateStore.setState({
                  showPreviousPeriod: checked,
                })
              }
            />
            <span className="ml-1">{t('Previous period')}</span>
          </div>

          <Button
            size="large"
            icon={<SyncOutlined />}
            onClick={handleRefresh}
          />

          {showDateFilter && (
            <div>
              <DateFilter />
            </div>
          )}
        </div>
      </div>

      <div>
        <TimeEventChart data={chartData} unit={unit} />
      </div>
    </LoadingView>
  );
});
WebsiteOverview.displayName = 'WebsiteOverview';

const MetricsBar: React.FC<{
  stats: AppRouterOutput['website']['stats'];
}> = React.memo((props) => {
  const { t } = useTranslation();
  const { pageviews, uniques, bounces, totaltime } = props.stats || {};
  const bouncesNum = Math.min(uniques.value, bounces.value) / uniques.value;
  const prevBouncesNum = Math.min(uniques.prev, bounces.prev) / uniques.prev;

  return (
    <div className="flex w-full flex-wrap gap-5">
      <MetricCard
        label={t('views')}
        value={pageviews.value}
        prev={pageviews.prev}
        change={pageviews.value - pageviews.prev}
      />
      <MetricCard
        label={t('visitors')}
        value={uniques.value}
        prev={uniques.prev}
        change={uniques.value - uniques.prev}
      />
      <MetricCard
        label={t('bounce rate')}
        reverseColors={true}
        value={uniques.value ? bouncesNum * 100 : 0}
        prev={uniques.prev ? prevBouncesNum * 100 : 0}
        change={
          uniques.value && uniques.prev
            ? bouncesNum * 100 - prevBouncesNum * 100 || 0
            : 0
        }
        format={(n) => formatNumber(n) + '%'}
      />
      <MetricCard
        label={t('average visit time')}
        value={
          totaltime.value && pageviews.value
            ? totaltime.value / (pageviews.value - bounces.value)
            : 0
        }
        prev={
          totaltime.prev && pageviews.prev
            ? totaltime.prev / (pageviews.prev - bounces.prev)
            : 0
        }
        change={
          totaltime.value && pageviews.value
            ? totaltime.value / (pageviews.value - bounces.value) -
                totaltime.prev / (pageviews.prev - bounces.prev) || 0
            : 0
        }
        format={(n) =>
          `${n < 0 ? '-' : ''}${formatShortTime(
            Math.abs(~~n),
            ['m', 's'],
            ' '
          )}`
        }
      />
    </div>
  );
});
MetricsBar.displayName = 'MetricsBar';
