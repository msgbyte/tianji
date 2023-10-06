import { Table } from 'antd';
import { ColumnsType } from 'antd/es/table/interface';
import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';

interface MetricsTableProps {
  websiteId: string;
  title: [string, string];
  type:
    | 'url'
    | 'language'
    | 'referrer'
    | 'browser'
    | 'os'
    | 'device'
    | 'country'
    | 'event';
  startAt: number;
  endAt: number;
}
export const MetricsTable: React.FC<MetricsTableProps> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId()!;
  const { websiteId, title, type, startAt, endAt } = props;

  const { isLoading, data: metrics = [] } = trpc.website.metrics.useQuery({
    workspaceId,
    websiteId,
    type,
    startAt,
    endAt,
  });

  const columns: ColumnsType<{ x: string; y: number }> = [
    {
      title: title[0],
      dataIndex: 'x',
    },
    {
      title: title[1],
      dataIndex: 'y',
      width: 100,
    },
  ];

  return (
    <Table
      rowKey="x"
      loading={isLoading}
      dataSource={metrics}
      columns={columns}
      size="small"
    />
  );
});
MetricsTable.displayName = 'MetricsTable';
