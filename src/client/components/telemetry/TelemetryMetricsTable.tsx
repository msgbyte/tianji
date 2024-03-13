import { Table } from 'antd';
import { ColumnsType } from 'antd/es/table/interface';
import React from 'react';
import { AppRouterOutput, trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { sum } from 'lodash-es';
import { formatNumber } from '../../utils/common';
import { useTranslation } from '@i18next-toolkit/react';

type MetricsItemType = AppRouterOutput['telemetry']['metrics'][number];

interface MetricsTableProps {
  telemetryId: string;
  title: [string, string];
  type: 'source' | 'url' | 'event' | 'referrer' | 'country';
  startAt: number;
  endAt: number;
}
export const TelemetryMetricsTable: React.FC<MetricsTableProps> = React.memo(
  (props) => {
    const { telemetryId, title, type, startAt, endAt } = props;
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();

    const { isLoading, data: metrics = [] } = trpc.telemetry.metrics.useQuery({
      workspaceId,
      telemetryId,
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
          val ?? <span className="italic opacity-60">{t('(None)')}</span>,
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
              <div className="inline-block w-12 relative border-l ml-1 px-1">
                <div
                  className="bg-blue-300 absolute h-full bg-opacity-25 left-0 top-0 pointer-events-none"
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
      <Table
        rowKey="x"
        loading={isLoading}
        dataSource={metrics}
        columns={columns}
        pagination={{
          pageSize: 10,
          hideOnSinglePage: true,
        }}
        size="small"
      />
    );
  }
);
TelemetryMetricsTable.displayName = 'TelemetryMetricsTable';
