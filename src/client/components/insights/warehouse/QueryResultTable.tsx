import React, { useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { DataTable, createColumnHelper } from '@/components/DataTable';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QueryColumn {
  name: string;
  type: string;
}

interface QueryResultTableProps {
  columns: QueryColumn[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTime: number;
}

export const QueryResultTable: React.FC<QueryResultTableProps> = React.memo(
  (props) => {
    const { columns, rows, rowCount, executionTime } = props;
    const { t } = useTranslation();

    // Create column definitions for DataTable
    const tableColumns = useMemo(() => {
      if (columns.length === 0) return [];

      const columnHelper = createColumnHelper<Record<string, any>>();

      return columns.map((col) =>
        columnHelper.accessor(col.name, {
          header: () => (
            <div className="flex flex-col">
              <div className="truncate font-medium" title={col.name}>
                {col.name}
              </div>
              <div className="text-muted-foreground text-xs font-normal">
                {col.type}
              </div>
            </div>
          ),
          cell: (info) => {
            const value = info.getValue();
            return (
              <div className="truncate" title={String(value)}>
                {value !== null && value !== undefined ? String(value) : '-'}
              </div>
            );
          },
          size: 150,
          minSize: 150,
        })
      );
    }, [columns]);

    if (columns.length === 0) {
      return (
        <div className="text-muted-foreground flex h-full items-center justify-center">
          {t('No query results to display')}
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col pt-2">
        {/* Table with scrolling */}
        <ScrollArea className="flex-1">
          <DataTable columns={tableColumns} data={rows} />
        </ScrollArea>

        {/* Stats bar */}
        <div className="text-muted-foreground border-b px-4 py-2 text-xs">
          {t('{{count}} rows returned in {{time}}ms', {
            count: rowCount,
            time: executionTime,
          })}
        </div>
      </div>
    );
  }
);
QueryResultTable.displayName = 'QueryResultTable';
