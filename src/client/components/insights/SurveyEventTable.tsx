import { useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { useLocalStorageState } from 'ahooks';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import dayjs from 'dayjs';
import { ColumnDef } from '@tanstack/react-table';
import { VirtualizedInfiniteDataTable } from '../VirtualizedInfiniteDataTable';
import { cn } from '@/utils/style';
import { Image } from 'antd';
import { CountryName } from '../CountryName';
import { DataTableColumnSelector } from '../DataTableColumnSelector';

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
  const [hiddenColumnIds = [], setHiddenColumnIds] = useLocalStorageState<
    string[]
  >(`tianji-survey-table-hidden-columns-${surveyId}`, {
    defaultValue: [],
  });
  const [columnOrder = [], setColumnOrder] = useLocalStorageState<string[]>(
    `tianji-survey-table-column-order-${surveyId}`,
    {
      defaultValue: [],
    }
  );

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

  const allColumns = useMemo<ColumnDef<EventData>[]>(() => {
    const baseColumns: ColumnDef<EventData>[] = [
      {
        id: 'createdAt',
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
            <div className="flex items-center gap-1">
              {value.split(',').map((url) => (
                <div className="h-6 w-6 overflow-hidden">
                  <Image
                    src={url}
                    alt={field.label}
                    width={24}
                    height={24}
                    preview={{
                      destroyOnClose: true,
                    }}
                  />
                </div>
              ))}
            </div>
          );
        }

        return value != null ? String(value) : '-';
      },
    }));

    const metaColumns: ColumnDef<EventData>[] = [
      {
        id: 'aiCategory',
        accessorFn: (row) => row.properties.aiCategory,
        header: t('AI Category'),
        size: 120,
      },
      {
        id: 'aiTranslation',
        accessorFn: (row) => row.properties.aiTranslation,
        header: t('AI Translation'),
        size: 200,
      },
      {
        id: 'country',
        accessorFn: (row) => row.properties.country,
        header: t('Country'),
        size: 100,
        cell: ({ getValue }) => {
          const value = getValue();
          return <CountryName country={String(value)} />;
        },
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

  const visibleColumns = useMemo(() => {
    const hiddenSet = new Set(hiddenColumnIds);
    const filtered = allColumns.filter((col) => !hiddenSet.has(col.id!));

    if (columnOrder.length === 0) {
      return filtered;
    }

    const orderMap = new Map(columnOrder.map((id, index) => [id, index]));
    return [...filtered].sort((a, b) => {
      const aIndex = orderMap.get(a.id!) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = orderMap.get(b.id!) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
  }, [allColumns, hiddenColumnIds, columnOrder]);

  return (
    <div
      className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}
    >
      <div className="mb-2 flex justify-end">
        <DataTableColumnSelector
          columns={allColumns}
          hiddenColumnIds={hiddenColumnIds}
          setHiddenColumnIds={setHiddenColumnIds}
          columnOrder={columnOrder}
          setColumnOrder={setColumnOrder}
        />
      </div>
      <div className="min-h-0 flex-1">
        <VirtualizedInfiniteDataTable
          columns={visibleColumns}
          data={data}
          hasNextPage={hasMore}
          isFetching={isLoading}
          isLoading={isLoading && data.length === 0}
          onFetchNextPage={onLoadMore ?? (() => {})}
        />
      </div>
    </div>
  );
};
