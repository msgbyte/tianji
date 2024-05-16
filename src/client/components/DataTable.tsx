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
import { LuArrowRight } from 'react-icons/lu';
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
                      'mr-1 h-5 w-5',
                      table.getIsAllRowsExpanded() && 'rotate-90'
                    )}
                    Icon={LuArrowRight}
                    onClick={table.getToggleAllRowsExpandedHandler()}
                  />
                </TableHead>
              )}

              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
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
                          'mr-1 h-5 w-5',
                          row.getIsExpanded() && 'rotate-90'
                        )}
                        Icon={LuArrowRight}
                        onClick={row.getToggleExpandedHandler()}
                      />
                    </TableCell>
                  )}

                  {row.getVisibleCells().map((cell, i) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );

              if (row.getIsExpanded() && ExpandComponent) {
                return (
                  <>
                    {renderedRow}

                    <TableRow key={row.id + 'expand'}>
                      <TableCell colSpan={table.getAllLeafColumns().length + 1}>
                        <ExpandComponent row={row.original} />
                      </TableCell>
                    </TableRow>
                  </>
                );
              } else {
                return renderedRow;
              }
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <Empty />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
