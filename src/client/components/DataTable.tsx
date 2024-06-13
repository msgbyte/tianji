import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  getExpandedRowModel,
  ExpandedState,
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
import React from 'react';
import { Button } from './ui/button';
import { LuChevronRight } from 'react-icons/lu';
import { cn } from '@/utils/style';

export type { ColumnDef };
export { createColumnHelper };

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  ExpandComponent?: React.ComponentType<{ row: TData }>;
}

export function DataTable<TData>({
  columns,
  data,
  ExpandComponent,
}: DataTableProps<TData>) {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const canExpand = Boolean(ExpandComponent);

  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getRowCanExpand: () => canExpand,
  });

  const columnLen = canExpand ? columns.length + 1 : columns.length;

  return (
    <div className="rounded-md border">
      <Table>
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
                  <TableHead key={header.id} className="text-nowrap">
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
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
                    <TableCell key={cell.id} className="text-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );

              return (
                <>
                  {renderedRow}

                  {row.getIsExpanded() && ExpandComponent && (
                    <TableRow key={row.id + 'expand'}>
                      <TableCell colSpan={columnLen}>
                        <ExpandComponent row={row.original} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
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
