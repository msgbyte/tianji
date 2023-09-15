import { Button, Tag } from 'antd';
import React, { useMemo } from 'react';
import { Column, ColumnConfig } from '@ant-design/charts';
import { ArrowRightOutlined, SyncOutlined } from '@ant-design/icons';
import { DateFilter } from './DateFilter';
import { HealthBar } from './HealthBar';
import {
  useWorkspaceWebsitePageview,
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

  const { stats, isLoading } = useWorkspaceWebsitePageview(
    props.website.workspaceId,
    props.website.id,
    startDate.unix() * 1000,
    endDate.unix() * 1000
  );

  const chartData = useMemo(() => {
    return getDateArray(stats, startDate, endDate, unit);
  }, [stats, unit]);

  if (isLoading) {
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
        <div className="flex gap-5 flex-wrap w-full lg:w-2/3">
          <MetricCard label="Views" value={20} diff={20} />
          <MetricCard label="Visitors" value={20} diff={20} />
          <MetricCard label="Bounce rate" value={20} diff={-20} unit="%" />
          <MetricCard
            label="Average visit time"
            value={20}
            diff={-20}
            unit="s"
          />
        </div>

        <div className="flex items-center gap-2 justify-end w-full lg:w-1/3">
          <Button size="large" icon={<SyncOutlined />} />

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

const MetricCard: React.FC<{
  label: string;
  value: number;
  diff: number;
  unit?: string;
}> = React.memo((props) => {
  const unit = props.unit ?? '';

  return (
    <div className="flex flex-col justify-center min-w-[140px] min-h-[90px]">
      <div className="flex items-center whitespace-nowrap font-bold text-4xl">
        {String(props.value)}
        {unit}
      </div>
      <div className="flex items-center whitespace-nowrap font-bold">
        <span className="mr-2">{props.label}</span>
        <Tag color={props.diff >= 0 ? 'green' : 'red'}>
          {props.diff >= 0 ? `+${props.diff}${unit}` : `${props.diff}${unit}`}
        </Tag>
      </div>
    </div>
  );
});
MetricCard.displayName = 'MetricCard';

export const StatsChart: React.FC<{
  data: { x: string; y: number }[];
  unit: DateUnit;
}> = React.memo((props) => {
  const config: ColumnConfig = useMemo(
    () => ({
      data: props.data,
      xField: 'x',
      yField: 'y',
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
