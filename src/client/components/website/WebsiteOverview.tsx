import { Button, message, Spin } from 'antd';
import React, { useMemo } from 'react';
import { Column, ColumnConfig } from '@ant-design/charts';
import { SyncOutlined } from '@ant-design/icons';
import { DateFilter } from '../DateFilter';
import {
  StatsItemType,
  useWorkspaceWebsitePageview,
  useWorkspaceWebsiteStats,
  WebsiteInfo,
} from '../../api/model/website';
import {
  DateUnit,
  formatDate,
  formatDateWithUnit,
  getDateArray,
} from '../../utils/date';
import { useEvent } from '../../hooks/useEvent';
import { MetricCard } from '../MetricCard';
import { formatNumber, formatShortTime } from '../../utils/common';
import { useTheme } from '../../hooks/useTheme';
import { WebsiteOnlineCount } from '../WebsiteOnlineCount';
import { useGlobalRangeDate } from '../../hooks/useGlobalRangeDate';
import { MonitorHealthBar } from '../monitor/MonitorHealthBar';
import { useNavigate } from 'react-router';

export const WebsiteOverview: React.FC<{
  website: WebsiteInfo;
  actions?: React.ReactNode;
}> = React.memo((props) => {
  const { website, actions } = props;
  const { startDate, endDate, unit, refresh } = useGlobalRangeDate();
  const navigate = useNavigate();

  const {
    pageviews,
    sessions,
    isLoading: isLoadingPageview,
    refetch: refetchPageview,
  } = useWorkspaceWebsitePageview(
    website.workspaceId,
    website.id,
    startDate.unix() * 1000,
    endDate.unix() * 1000,
    unit
  );

  const {
    stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useWorkspaceWebsiteStats(
    website.workspaceId,
    website.id,
    startDate.unix() * 1000,
    endDate.unix() * 1000,
    unit
  );

  const handleRefresh = useEvent(async () => {
    refresh();

    await Promise.all([refetchPageview(), refetchStats()]);

    message.success('Refreshed');
  });

  const chartData = useMemo(() => {
    const pageviewsArr = getDateArray(pageviews, startDate, endDate, unit);
    const sessionsArr = getDateArray(sessions, startDate, endDate, unit);

    return [
      ...pageviewsArr.map((item) => ({ ...item, type: 'pageview' })),
      ...sessionsArr.map((item) => ({ ...item, type: 'session' })),
    ];
  }, [pageviews, sessions, unit]);

  const loading = isLoadingPageview || isLoadingStats;

  return (
    <Spin spinning={loading}>
      <div className="flex">
        <div className="flex flex-1 text-2xl font-bold items-center">
          <span className="mr-2" title={website.domain ?? ''}>
            {website.name}
          </span>

          {website.monitorId && (
            <div
              className="cursor-pointer"
              onClick={() => navigate(`/monitor/${website.monitorId}`)}
            >
              <MonitorHealthBar monitorId={website.monitorId} />
            </div>
          )}

          <div className="ml-4 text-base font-normal">
            <WebsiteOnlineCount
              workspaceId={website.workspaceId}
              websiteId={website.id}
            />
          </div>
        </div>

        <div>{actions}</div>
      </div>

      <div className="flex mb-10 flex-wrap">
        {stats && <MetricsBar stats={stats} />}

        <div className="flex items-center gap-2 justify-end w-full lg:w-1/3">
          <Button
            size="large"
            icon={<SyncOutlined />}
            onClick={handleRefresh}
          />

          <div>
            <DateFilter />
          </div>
        </div>
      </div>

      <div>
        <StatsChart data={chartData} unit={unit} />
      </div>
    </Spin>
  );
});
WebsiteOverview.displayName = 'WebsiteOverview';

export const MetricsBar: React.FC<{
  stats: {
    bounces: StatsItemType;
    pageviews: StatsItemType;
    totaltime: StatsItemType;
    uniques: StatsItemType;
  };
}> = React.memo((props) => {
  const { pageviews, uniques, bounces, totaltime } = props.stats || {};
  const num = Math.min(uniques.value, bounces.value);
  const diffs = {
    pageviews: pageviews.value - pageviews.change,
    uniques: uniques.value - uniques.change,
    bounces: bounces.value - bounces.change,
    totaltime: totaltime.value - totaltime.change,
  };

  return (
    <div className="flex gap-5 flex-wrap w-full lg:w-2/3">
      <MetricCard
        label="Views"
        value={pageviews.value}
        change={pageviews.change}
      />
      <MetricCard
        label="Visitors"
        value={uniques.value}
        change={uniques.change}
      />
      <MetricCard
        label="Bounce rate"
        reverseColors={true}
        value={uniques.value ? (num / uniques.value) * 100 : 0}
        change={
          uniques.value && uniques.change
            ? (num / uniques.value) * 100 -
                (Math.min(diffs.uniques, diffs.bounces) / diffs.uniques) *
                  100 || 0
            : 0
        }
        format={(n) => formatNumber(n) + '%'}
      />
      <MetricCard
        label="Average visit time"
        value={
          totaltime.value && pageviews.value
            ? totaltime.value / (pageviews.value - bounces.value)
            : 0
        }
        change={
          totaltime.value && pageviews.value
            ? (diffs.totaltime / (diffs.pageviews - diffs.bounces) -
                totaltime.value / (pageviews.value - bounces.value)) *
                -1 || 0
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

export const StatsChart: React.FC<{
  data: { x: string; y: number; type: string }[];
  unit: DateUnit;
}> = React.memo((props) => {
  const { colors } = useTheme();

  const config = useMemo(
    () =>
      ({
        data: props.data,
        isStack: true,
        xField: 'x',
        yField: 'y',
        seriesField: 'type',
        label: {
          position: 'middle' as const,
          style: {
            fill: '#FFFFFF',
            opacity: 0.6,
          },
        },
        tooltip: {
          title: (t) => formatDate(t),
        },
        color: [colors.chart.pv, colors.chart.uv],
        xAxis: {
          label: {
            autoHide: true,
            autoRotate: false,
            formatter: (text) => formatDateWithUnit(text, props.unit),
          },
        },
      } as ColumnConfig),
    [props.data, props.unit]
  );

  return <Column {...config} />;
});
StatsChart.displayName = 'StatsChart';
