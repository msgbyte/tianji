import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { DataTable, createColumnHelper } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';

const columnHelper = createColumnHelper<any>();

interface WorkerExecutionsTableProps {
  executions: {
    id: string;
    status: string;
    duration: number | null;
    memoryUsed: number | null;
    cpuTime: number | null;
    createdAt: string;
  }[];
  loading?: boolean;
  onExecutionSelect?: (execution: any, index: number) => void;
}

export const WorkerExecutionsTable: React.FC<WorkerExecutionsTableProps> =
  React.memo((props) => {
    const { executions, loading = false, onExecutionSelect } = props;
    const { t } = useTranslation();

    const columns = [
      columnHelper.accessor('id', {
        header: 'ID',
        size: 120,
        cell: (props) => {
          const execution = props.row.original;
          const id = props.getValue();
          return (
            <div
              className="cursor-pointer font-mono text-sm hover:underline hover:decoration-dotted"
              onClick={() => {
                onExecutionSelect?.(execution, props.row.index);
              }}
            >
              {id.slice(0, 8)}
            </div>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: t('Status'),
        size: 100,
        cell: (props) => {
          const status = props.getValue();
          return (
            <Badge
              variant={
                status === 'Success'
                  ? 'default'
                  : status === 'Failed'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {status}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('duration', {
        header: t('Duration'),
        size: 100,
        cell: (props) => {
          const duration = props.getValue();
          return duration !== null ? `${duration}ms` : '-';
        },
      }),
      columnHelper.accessor('memoryUsed', {
        header: t('Memory Used'),
        size: 120,
        cell: (props) => {
          const memoryUsed = props.getValue();
          return memoryUsed !== null
            ? `${Math.round(memoryUsed / 1024)}KB`
            : '-';
        },
      }),
      columnHelper.accessor('cpuTime', {
        header: t('CPU Time'),
        size: 100,
        cell: (props) => {
          const cpuTime = props.getValue();
          return cpuTime !== null ? `${Math.round(cpuTime / 1000000)}ms` : '-';
        },
      }),
      columnHelper.accessor('createdAt', {
        header: t('Created At'),
        size: 180,
        cell: (props) => {
          const createdAt = props.getValue();
          return dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss');
        },
      }),
    ];

    if (loading) {
      return (
        <div className="text-muted-foreground py-8 text-center">
          {t('Loading...')}
        </div>
      );
    }

    if (!executions || executions.length === 0) {
      return (
        <div className="text-muted-foreground py-8 text-center">
          {t('No executions yet')}
        </div>
      );
    }

    return <DataTable columns={columns} data={executions} />;
  });

WorkerExecutionsTable.displayName = 'WorkerExecutionsTable';
