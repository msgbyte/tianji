import React, { useCallback, useEffect, useMemo, useRef } from 'react';

//3 TanStack Libraries!!!
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  useReactTable,
} from '@tanstack/react-table';
import { InfiniteData } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useTranslation } from '@i18next-toolkit/react';
import { cn } from '@/utils/style';
import { LoadingView } from './LoadingView';

interface VirtualizedInfiniteDataTableProps<TData> {
  selectedIndex?: number;
  columns: ColumnDef<TData, any>[];
  data: TData[];
  onFetchNextPage: () => void;
  isFetching: boolean;
  isLoading: boolean;
  hasNextPage: boolean | undefined;
}

export function VirtualizedInfiniteDataTable<TData>(
  props: VirtualizedInfiniteDataTableProps<TData>
) {
  const {
    selectedIndex,
    columns,
    data,
    onFetchNextPage,
    isFetching,
    isLoading,
    hasNextPage,
  } = props;
  const { t } = useTranslation();

  //we need a reference to the scrolling element for logic down below
  const tableContainerRef = useRef<HTMLDivElement>(null);

  //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        //once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
        if (
          scrollHeight - scrollTop - clientHeight < 500 &&
          !isFetching &&
          hasNextPage
        ) {
          onFetchNextPage();
        }
      }
    },
    [onFetchNextPage, isFetching, hasNextPage]
  );

  // a check on mount and after a fetch to see if the table is already scrolled to the bottom and immediately needs to fetch more data
  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 40, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  /**
   * Instead of calling `column.getSize()` on every render for every header
   * and especially every data cell (very expensive),
   * we will calculate all column sizes at once at the root table level in a useMemo
   * and pass the column sizes down as CSS variables to the <table> element.
   */
  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!;
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes;
  }, [table.getState().columnSizingInfo, table.getState().columnSizing]);

  return (
    <LoadingView isLoading={isLoading}>
      <div
        className="virtualized-infinite-data-table relative h-full overflow-auto"
        onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
        ref={tableContainerRef}
      >
        {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
        <table style={{ display: 'grid' }}>
          <TableHeader
            className="sticky top-0 z-10 grid"
            style={{
              ...columnSizeVars,
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-background hover:bg-background flex w-full"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="relative overflow-hidden text-ellipsis text-nowrap pt-2.5"
                      style={{
                        width: `calc(var(--header-${header?.id}-size) * 1px)`,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}

                      <div
                        {...{
                          onDoubleClick: () => header.column.resetSize(),
                          onMouseDown: header.getResizeHandler(),
                          onTouchStart: header.getResizeHandler(),
                          className: `resizer ${
                            header.column.getIsResizing() ? 'isResizing' : ''
                          }`,
                        }}
                      />
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className="relative grid"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index] as Row<TData>;
              return (
                <TableRow
                  data-index={virtualRow.index} //needed for dynamic row height measurement
                  ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                  key={row.id}
                  className="absolute flex w-full"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const content = flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    );
                    const value = cell.getValue();
                    const useSystemTooltip =
                      typeof value === 'string' || typeof value === 'number';

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'flex transition-all',
                          selectedIndex === virtualRow.index &&
                            'bg-zinc-200 dark:bg-zinc-700'
                        )}
                        style={{
                          width: cell.column.getSize(),
                        }}
                      >
                        {useSystemTooltip ? (
                          <div
                            className="w-full cursor-default overflow-hidden text-ellipsis whitespace-nowrap text-left"
                            title={String(value)}
                          >
                            {content}
                          </div>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild={true}>
                              <div className="w-full cursor-default overflow-hidden text-ellipsis whitespace-nowrap text-left">
                                {content}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{content}</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </table>

        {isFetching && (
          <div className="w-full text-center text-sm">
            {t('Fetching More...')}
          </div>
        )}
      </div>
    </LoadingView>
  );
}
VirtualizedInfiniteDataTable.displayName = 'VirtualizedInfiniteDataTable';
