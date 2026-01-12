import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Checkbox } from './ui/checkbox';
import { LuSettings2 } from 'react-icons/lu';

interface DataTableColumnSelectorProps<TData> {
  columns: ColumnDef<TData>[];
  hiddenColumnIds: Set<string>;
  setHiddenColumnIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

function getColumnHeader<TData>(col: ColumnDef<TData>): string {
  if (typeof col.header === 'string') {
    return col.header;
  }
  return col.id || '';
}

export function DataTableColumnSelector<TData>({
  columns,
  hiddenColumnIds,
  setHiddenColumnIds,
}: DataTableColumnSelectorProps<TData>) {
  const { t } = useTranslation();

  const toggleColumn = (columnId: string) => {
    setHiddenColumnIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" Icon={LuSettings2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-auto">
        <DropdownMenuLabel>{t('Toggle columns')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => toggleColumn(col.id!)}
          >
            <Checkbox checked={!hiddenColumnIds.has(col.id!)} />
            <span>{getColumnHeader(col)}</span>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
