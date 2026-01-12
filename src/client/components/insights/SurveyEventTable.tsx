import { useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import dayjs from 'dayjs';
import { ColumnDef } from '@tanstack/react-table';
import { VirtualizedInfiniteDataTable } from '../VirtualizedInfiniteDataTable';
import { cn } from '@/utils/style';
import { Image } from 'antd';

interface EventData {
  id: string;
  name: string;
  createdAt: string;
  properties: Record<string, any>;
}

interface SurveyEventTableProps {
  surveyId: string;
  data: EventData[];
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export const SurveyEventTable: React.FC<SurveyEventTableProps> = ({
  surveyId,
  data,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  className,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const { data: survey } = trpc.survey.get.useQuery(
    { workspaceId, surveyId },
    { enabled: Boolean(surveyId) }
  );

  const surveyFields = useMemo(() => {
    if (!survey?.payload) return [];
    const payload = survey.payload as {
      items: Array<{ label: string; name: string; type: string }>;
    };
    return payload.items || [];
  }, [survey]);

  const columns = useMemo<ColumnDef<EventData>[]>(() => {
    const baseColumns: ColumnDef<EventData>[] = [
      {
        accessorKey: 'createdAt',
        header: t('Time'),
        size: 180,
        cell: ({ row }) => {
          const eventDate = dayjs(row.original.createdAt);
          return eventDate.isValid()
            ? eventDate.format('YYYY-MM-DD HH:mm:ss')
            : '-';
        },
      },
    ];

    const fieldColumns: ColumnDef<EventData>[] = surveyFields.map((field) => ({
      id: field.name,
      accessorFn: (row) => row.properties[field.name],
      header: field.label,
      size: 150,
      cell: ({ getValue }) => {
        const value = getValue();

        if (
          field.type === 'imageUrl' &&
          typeof value === 'string' &&
          value.startsWith('http')
        ) {
          return (
            <div className="h-6 w-6 overflow-hidden">
              <Image
                src={value}
                alt={field.label}
                width={24}
                height={24}
                preview={{
                  destroyOnClose: true,
                }}
              />
            </div>
          );
        }

        return value != null ? String(value) : '-';
      },
    }));

    const metaColumns: ColumnDef<EventData>[] = [
      {
        id: 'country',
        accessorFn: (row) => row.properties.country,
        header: t('Country'),
        size: 100,
      },
      {
        id: 'browser',
        accessorFn: (row) => row.properties.browser,
        header: t('Browser'),
        size: 100,
      },
    ];

    return [...baseColumns, ...fieldColumns, ...metaColumns];
  }, [surveyFields, t]);

  return (
    <div className={cn('h-full min-h-0 overflow-hidden', className)}>
      <VirtualizedInfiniteDataTable
        columns={columns}
        data={data}
        hasNextPage={hasMore}
        isFetching={isLoading}
        isLoading={isLoading && data.length === 0}
        onFetchNextPage={onLoadMore ?? (() => {})}
      />
    </div>
  );
};
