import { useMemo, useState, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LuDownload, LuLoader } from 'react-icons/lu';
import { downloadCSVJson } from '@/utils/dom';
import { getUserTimezone } from '@/api/model/user';
import { showErrorToast } from '@/utils/error';
import { useInsightsStore } from '@/store/insights';
import { useEvent } from '@/hooks/useEvent';

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
  const filters = useInsightsStore((state) =>
    state.currentFilters.filter((f): f is NonNullable<typeof f> => !!f)
  );
  const dateRange = useInsightsStore((state) => state.currentDateRange);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const trpcUtils = trpc.useUtils();
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
  const [allowWrap = true, setAllowWrap] = useLocalStorageState<boolean>(
    `tianji-survey-table-allow-wrap-${surveyId}`,
    {
      defaultValue: false,
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

  const handleDownloadCSV = useEvent(async () => {
    if (!dateRange) return;

    setIsDownloading(true);
    setDownloadedCount(0);
    try {
      const allData: EventData[] = [];
      const limit = 1000;
      let cursor: string | undefined;

      while (true) {
        const result = await trpcUtils.insights.queryEvents.fetch({
          workspaceId,
          insightId: surveyId,
          insightType: 'survey',
          metrics: [{ name: '$all_event', math: 'events' as const }],
          filters,
          groups: [],
          time: {
            startAt: dayjs(dateRange[0]).valueOf(),
            endAt: dayjs(dateRange[1]).valueOf(),
            unit: 'day' as const,
            timezone: getUserTimezone(),
          },
          cursor,
          limit,
        });

        allData.push(...result);
        setDownloadedCount(allData.length);

        if (result.length < limit) {
          break;
        }

        cursor = result[result.length - 1]?.id;
      }

      const exportData = allData.map((item) => {
        const row: Record<string, any> = {
          createdAt: dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        };

        surveyFields.forEach((field) => {
          row[field.label] = item.properties[field.name] ?? '';
        });

        row[t('AI Category')] = item.properties.aiCategory ?? '';
        row[t('AI Translation')] = item.properties.aiTranslation ?? '';
        row[t('Country')] = item.properties.country ?? '';
        row[t('Browser')] = item.properties.browser ?? '';

        return row;
      });

      await downloadCSVJson(
        exportData,
        `survey-${surveyId}-export-${Date.now()}`
      );
    } catch (err) {
      showErrorToast(err);
    } finally {
      setIsDownloading(false);
    }
  });

  return (
    <div className={cn('relative flex h-full min-h-0 flex-col', className)}>
      <div className="absolute -top-12 right-0 mb-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Switch
            id="allow-wrap"
            checked={allowWrap}
            onCheckedChange={setAllowWrap}
          />
          <Label htmlFor="allow-wrap" className="cursor-pointer text-xs">
            {t('Wrap')}
          </Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadCSV}
          disabled={isDownloading || !dateRange}
        >
          {isDownloading ? (
            <>
              <LuLoader className="mr-1 h-4 w-4 animate-spin" />
              {downloadedCount.toLocaleString()}
            </>
          ) : (
            <>
              <LuDownload className="mr-1 h-4 w-4" />
              {t('Download CSV')}
            </>
          )}
        </Button>
        <DataTableColumnSelector
          columns={allColumns}
          hiddenColumnIds={hiddenColumnIds}
          setHiddenColumnIds={setHiddenColumnIds}
          columnOrder={columnOrder}
          setColumnOrder={setColumnOrder}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <VirtualizedInfiniteDataTable
          columns={visibleColumns}
          data={data}
          hasNextPage={hasMore}
          isFetching={isLoading}
          isLoading={isLoading && data.length === 0}
          onFetchNextPage={onLoadMore ?? (() => {})}
          allowWrap={allowWrap}
        />
      </div>
    </div>
  );
};
