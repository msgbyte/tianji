import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  ExpandedState,
  RowData,
  Column,
  ColumnPinningState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Empty } from 'antd';
import React, { Fragment } from 'react';
import { Button } from './ui/button';
import { LuChevronRight } from 'react-icons/lu';
import { cn } from '@/utils/style';

export type { ColumnDef };
export { createColumnHelper };

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  columnPinning?: ColumnPinningState;
  ExpandComponent?: React.ComponentType<{ row: TData }>;
}

export function DataTable<TData>({
  columns,
  data,
  columnPinning = { left: [], right: [] },
  ExpandComponent,
}: DataTableProps<TData>) {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const canExpand = Boolean(ExpandComponent);

  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
      columnPinning,
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getRowCanExpand: () => canExpand,
  });

  const columnLen = canExpand ? columns.length + 1 : columns.length;

  return (
    <div className="overflow-hidden rounded-md border">
      <Table style={{ width: table.getCenterTotalSize() }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {canExpand && (
                <TableHead className="w-9">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'mr-1 h-5 w-5 transition-transform',
                      table.getIsAllRowsExpanded() && 'rotate-90'
                    )}
                    Icon={LuChevronRight}
                    onClick={table.getToggleAllRowsExpandedHandler()}
                  />
                </TableHead>
              )}

              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-nowrap',
                      header.column.columnDef.meta?.className
                    )}
                    style={{
                      ...getCommonPinningStyles(header.column),
                      width: header.getSize(),
                      minWidth: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="overflow-auto">
          {table.getRowModel().rows?.length > 0 ? (
            table.getRowModel().rows.map((row) => {
              const renderedRow = (
                <TableRow data-state={row.getIsSelected() && 'selected'}>
                  {row.getCanExpand() && (
                    <TableCell className="w-9">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'mr-1 h-5 w-5 transition-transform',
                          row.getIsExpanded() && 'rotate-90'
                        )}
                        Icon={LuChevronRight}
                        onClick={row.getToggleExpandedHandler()}
                      />
                    </TableCell>
                  )}

                  {row.getVisibleCells().map((cell, i) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'text-nowrap',
                        cell.column.columnDef.meta?.className
                      )}
                      style={{ ...getCommonPinningStyles(cell.column) }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );

              return (
                <Fragment key={row.id}>
                  {renderedRow}

                  {row.getIsExpanded() && ExpandComponent && (
                    <TableRow
                      key={row.id + 'expand'}
                      className="hover:bg-transparent"
                    >
                      <TableCell colSpan={columnLen}>
                        <ExpandComponent row={row.original} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columnLen} className="h-24 text-center">
                <Empty />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
DataTable.displayName = 'DataTable';

function getCommonPinningStyles<TData>(
  column: Column<TData>
): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right');

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '-4px 0 4px -4px gray inset'
      : isFirstRightPinnedColumn
        ? '4px 0 4px -4px gray inset'
        : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
}
