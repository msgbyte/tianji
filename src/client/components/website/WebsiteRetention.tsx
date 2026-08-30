import { getUserTimezone } from '@/api/model/user';
import { AppRouterOutput, trpc } from '@/api/trpc';
import { useTranslation } from '@i18next-toolkit/react';
import { Table, Tooltip, theme } from 'antd';
import { ColumnsType } from 'antd/es/table/interface';
import dayjs from 'dayjs';

type RetentionRow = AppRouterOutput['website']['retention'][number];
type RetentionDay = 'd1' | 'd3' | 'd5' | 'd7' | 'd14';

interface WebsiteRetentionProps {
  workspaceId: string;
  websiteId: string;
  startAt: number;
  endAt: number;
}

export function WebsiteRetention({
  workspaceId,
  websiteId,
  startAt,
  endAt,
}: WebsiteRetentionProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const selectedEnd = dayjs(endAt);
  const completeEnd = selectedEnd.isBefore(dayjs(), 'day')
    ? selectedEnd.endOf('day')
    : dayjs().subtract(1, 'day').endOf('day');
  const selectedStart = dayjs(startAt).startOf('day');
  const cohortStart =
    completeEnd.diff(selectedStart, 'day') < 30
      ? completeEnd.subtract(30, 'day').startOf('day')
      : selectedStart;
  const { data = [], isLoading } = trpc.website.retention.useQuery({
    workspaceId,
    websiteId,
    startAt: cohortStart.valueOf(),
    endAt: completeEnd.valueOf(),
    timezone: getUserTimezone(),
  });

  const columns: ColumnsType<RetentionRow> = [
    {
      title: t('Cohort date'),
      dataIndex: 'date',
    },
    {
      title: t('New visitors'),
      dataIndex: 'cohortSize',
      align: 'center',
    },
    ...(['d1', 'd3', 'd5', 'd7', 'd14'] as RetentionDay[]).map(
      (day) => ({
        title: day.toUpperCase(),
        dataIndex: day,
        align: 'center' as const,
        render: (count: number | null, row: RetentionRow) => {
          if (count === null) {
            return <span className="opacity-50">—</span>;
          }

          const rate = row.cohortSize ? (count / row.cohortSize) * 100 : 0;

          return (
            <Tooltip title={`${count} / ${row.cohortSize}`}>
              <div
                className="rounded px-2 py-1 tabular-nums"
                style={{
                  backgroundColor: `color-mix(in srgb, ${token.colorPrimary} ${rate}%, transparent)`,
                }}
              >
                {rate.toFixed(1)}%
              </div>
            </Tooltip>
          );
        },
      })
    ),
  ];

  return (
    <div>
      <div className="mb-4">
        <div className="font-medium">{t('Visitor retention')}</div>
        <div className="text-xs opacity-60">
          {t('Estimated from anonymous visitor fingerprints')}
        </div>
      </div>
      <Table
        rowKey="date"
        dataSource={data}
        columns={columns}
        loading={isLoading}
        pagination={false}
        scroll={{ x: 640 }}
        size="small"
      />
    </div>
  );
}
