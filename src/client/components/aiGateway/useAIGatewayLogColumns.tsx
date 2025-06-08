import { AppRouterOutput } from '@/api/trpc';
import { createColumnHelper } from '@tanstack/react-table';
import { useTranslation } from '@i18next-toolkit/react';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import { AIGatewayStatus } from './AIGatewayStatus';

type AIGatewayLogItem = AppRouterOutput['aiGateway']['logs']['items'][number];

const columnHelper = createColumnHelper<AIGatewayLogItem>();

// Generic render function for fields that should show "(null)" when value is -1
const renderNullableValue = (value: number) => {
  if (value === -1) {
    return <span className="text-muted-foreground opacity-50">(null)</span>;
  }
  return value;
};

export function useAIGatewayLogColumns(onRowSelect?: (index: number) => void) {
  const { t } = useTranslation();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('id', {
        header: 'ID',
        size: 100,
        cell: (props) => {
          return (
            <div
              className="cursor-pointer hover:underline hover:decoration-dotted"
              onClick={() => {
                if (onRowSelect) {
                  onRowSelect(props.row.index);
                }
              }}
            >
              {props.getValue().substring(0, 8)}
            </div>
          );
        },
      }),
      columnHelper.accessor('modelName', {
        header: t('Model'),
        size: 120,
      }),
      columnHelper.accessor('status', {
        header: t('Status'),
        size: 100,
        cell: (props) => {
          const status = props.getValue();
          return <AIGatewayStatus status={status} />;
        },
      }),
      columnHelper.accessor('inputToken', {
        header: t('Input Tokens'),
        size: 120,
        cell: (props) => renderNullableValue(props.getValue()),
      }),
      columnHelper.accessor('outputToken', {
        header: t('Output Tokens'),
        size: 120,
        cell: (props) => renderNullableValue(props.getValue()),
      }),
      columnHelper.accessor('price', {
        header: t('Price ($)'),
        size: 120,
      }),
      columnHelper.accessor('duration', {
        header: t('Duration (ms)'),
        size: 120,
        cell: (props) => renderNullableValue(props.getValue()),
      }),
      columnHelper.accessor('ttft', {
        header: t('TTFT (ms)'),
        size: 100,
        cell: (props) => renderNullableValue(props.getValue()),
      }),
      columnHelper.accessor('stream', {
        header: t('Stream'),
        size: 80,
        cell: (props) => (props.getValue() ? t('Yes') : t('No')),
      }),
      columnHelper.accessor('createdAt', {
        header: t('Time'),
        size: 180,
        cell: (props) => dayjs(props.getValue()).format('YYYY-MM-DD HH:mm:ss'),
      }),
    ];
  }, [t, onRowSelect]);

  return { columns };
}
