import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  getExpandedRowModel,
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
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
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
                  {row.getVisibleCells().map((cell) => (
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
                      <TableCell colSpan={table.getAllLeafColumns().length}>
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
