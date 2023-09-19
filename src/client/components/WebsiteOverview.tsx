import { Button, message, Tag } from 'antd';
import React, { useMemo } from 'react';
import { Column, ColumnConfig } from '@ant-design/charts';
import { ArrowRightOutlined, SyncOutlined } from '@ant-design/icons';
import { DateFilter } from './DateFilter';
import { HealthBar } from './HealthBar';
import {
  StatsItemType,
  useWorkspaceWebsitePageview,
  useWorkspaceWebsiteStats,
  useWorspaceWebsites,
  WebsiteInfo,
} from '../api/model/website';
import { Loading } from './Loading';
import dayjs from 'dayjs';
import {
  DateUnit,
  formatDate,
  formatDateWithUnit,
  getDateArray,
} from '../utils/date';
import { useEvent } from '../hooks/useEvent';
import { MetricCard } from './MetricCard';
import { formatNumber, formatShortTime } from '../utils/common';

interface WebsiteOverviewProps {
  workspaceId: string;
}
export const WebsiteOverview: React.FC<WebsiteOverviewProps> = React.memo(
  (props) => {
    const { isLoading, websites } = useWorspaceWebsites(props.workspaceId);

    if (isLoading) {
      return <Loading />;
    }

    return (
      <div>
        {websites.map((website) => (
          <WebsiteOverviewItem key={website.id} website={website} />
        ))}
      </div>
    );
  }
);
WebsiteOverview.displayName = 'WebsiteOverview';

const WebsiteOverviewItem: React.FC<{
  website: WebsiteInfo;
}> = React.memo((props) => {
  const unit: DateUnit = 'hour';
  const startDate = dayjs().subtract(1, 'day').add(1, unit).startOf(unit);
  const endDate = dayjs().endOf(unit);

  const {
    pageviews,
    sessions,
    isLoading: isLoadingPageview,
    refetch: refetchPageview,
  } = useWorkspaceWebsitePageview(
    props.website.workspaceId,
    props.website.id,
    startDate.unix() * 1000,
    endDate.unix() * 1000,
    unit
  );

  const {
    stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useWorkspaceWebsiteStats(
    props.website.workspaceId,
    props.website.id,
    startDate.unix() * 1000,
    endDate.unix() * 1000,
    unit
  );

  const handleRefresh = useEvent(async () => {
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

  if (isLoadingPageview || isLoadingStats) {
    return <Loading />;
  }

  return (
    <div className="mb-10 pb-10 border-b">
      <div className="flex">
        <div className="flex flex-1 text-2xl font-bold items-center">
          <span className="mr-2" title={props.website.domain ?? ''}>
            {props.website.name}
          </span>

          <HealthBar
            beats={Array.from({ length: 13 }).map(() => ({
              status: 'health',
            }))}
          />
        </div>

        <div>
          <Button type="primary" size="large">
            View Details <ArrowRightOutlined />
          </Button>
        </div>
      </div>

      <div className="flex mb-10 flex-wrap">
        {stats && <MetricsBar stats={stats} />}

        <div className="flex items-center gap-2 justify-end w-full lg:w-1/3">
          <Button
            size="large"
            icon={<SyncOutlined />}
            onClick={handleRefresh}
          />

          <DateFilter />
        </div>
      </div>

      <div>
        <StatsChart data={chartData} unit={unit} />
      </div>
    </div>
  );
});
WebsiteOverviewItem.displayName = 'WebsiteOverviewItem';

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
  const config: ColumnConfig = useMemo(
    () => ({
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
      xAxis: {
        label: {
          autoHide: true,
          autoRotate: false,
          formatter: (text) => formatDateWithUnit(text, props.unit),
        },
      },
    }),
    [props.data, props.unit]
  );

  return <Column {...config} />;
});
StatsChart.displayName = 'StatsChart';
