import { Table } from 'antd';
import { ColumnsType } from 'antd/es/table/interface';
import React from 'react';
import { AppRouterOutput, trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { sum } from 'lodash-es';
import { formatNumber } from '../../utils/common';
import { useTranslation } from '@i18next-toolkit/react';
import { useCountryMap } from '@/utils/country';
import { LoadingView } from '../LoadingView';

type MetricsItemType = AppRouterOutput['website']['metrics'][number];

interface MetricsTableProps {
  websiteId: string;
  title: [string, string];
  type:
    | 'url'
    | 'language'
    | 'referrer'
    | 'title'
    | 'browser'
    | 'os'
    | 'device'
    | 'country'
    | 'event'
    | 'utm_source'
    | 'utm_medium'
    | 'utm_campaign'
    | 'utm_term'
    | 'utm_content';
  startAt: number;
  endAt: number;
}
export const WebsiteMetricsTable: React.FC<MetricsTableProps> = React.memo(
  (props) => {
    const { websiteId, title, type, startAt, endAt } = props;
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();
    const countryMap = useCountryMap();
    const labelMap: Record<string, string> = {
      desktop: t('Desktop'),
      laptop: t('Laptop'),
      tablet: t('Tablet'),
      mobile: t('Mobile'),
      ...countryMap,
    };

    const { isLoading, data: metrics = [] } = trpc.website.metrics.useQuery({
      workspaceId,
      websiteId,
      type,
      startAt,
      endAt,
    });

    const total = sum(metrics.map((m) => m.y));

    const columns: ColumnsType<MetricsItemType> = [
      {
        title: title[0],
        dataIndex: 'x',
        ellipsis: true,
        render: (val) =>
          val ? (
            <span title={val}>{labelMap[val] ?? val}</span>
          ) : (
            <span className="italic opacity-60">{t('(None)')}</span>
          ),
      },
      {
        title: title[1],
        dataIndex: 'y',
        width: 100,
        align: 'center',
        render: (val) => {
          const percent = (Number(val) / total) * 100;

          return (
            <div className="flex">
              <div className="w-12 text-right">{formatNumber(val)}</div>
              <div className="relative ml-1 inline-block w-12 border-l px-1">
                <div
                  className="pointer-events-none absolute left-0 top-0 h-full bg-blue-300 bg-opacity-25"
                  style={{ width: `${percent}%` }}
                />
                <span>{percent.toFixed(0)}%</span>
              </div>
            </div>
          );
        },
      },
    ];

    return (
      <LoadingView isLoading={isLoading}>
        <Table
          rowKey="x"
          dataSource={metrics}
          columns={columns}
          pagination={{
            pageSize: 10,
            hideOnSinglePage: true,
            showSizeChanger: false,
          }}
          size="small"
        />
      </LoadingView>
    );
  }
);
WebsiteMetricsTable.displayName = 'WebsiteMetricsTable';
