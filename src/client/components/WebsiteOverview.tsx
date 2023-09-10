import { Button, Tag } from 'antd';
import React from 'react';
import { Column } from '@ant-design/charts';
import { ArrowRightOutlined, SyncOutlined } from '@ant-design/icons';
import { DateFilter } from './DateFilter';
import { HealthBar } from './HealthBar';
import { useWorspaceWebsites, WebsiteInfo } from '../api/model/website';
import { Loading } from './Loading';

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
        <DemoChart />
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

export const DemoChart: React.FC = React.memo(() => {
  const data = [
    {
      type: '家具家电',
      sales: 38,
    },
    {
      type: '粮油副食',
      sales: 52,
    },
    {
      type: '生鲜水果',
      sales: 61,
    },
    {
      type: '美容洗护',
      sales: 145,
    },
    {
      type: '母婴用品',
      sales: 48,
    },
    {
      type: '进口食品',
      sales: 38,
    },
    {
      type: '食品饮料',
      sales: 38,
    },
    {
      type: '家庭清洁',
      sales: 38,
    },
  ];
  const config = {
    data,
    xField: 'type',
    yField: 'sales',
    label: {
      // 可手动配置 label 数据标签位置
      position: 'middle' as const,
      // 'top', 'bottom', 'middle',
      // 配置样式
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      type: {
        alias: '类别',
      },
      sales: {
        alias: '销售额',
      },
    },
  };

  return <Column {...config} />;
});
DemoChart.displayName = 'DemoChart';
