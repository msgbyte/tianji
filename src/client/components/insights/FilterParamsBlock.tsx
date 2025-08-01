import React, { useState } from 'react';
import { PopoverTrigger } from '@/components/ui/popover';
import { Input } from '../ui/input';
import { useTranslation } from '@i18next-toolkit/react';
import { LuEllipsisVertical, LuTrash2 } from 'react-icons/lu';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { DropdownSelect } from './DropdownSelect';
import { DataTypeIcon } from './DataTypeIcon';
import { FilterParamsOperator } from './FilterParamsOperator';
import { FilterInfo } from '@tianji/shared';
import { defaultOperators } from './utils/filterOperator';
import { cn } from '@/utils/style';

interface FilterParamsBlockProps {
  index: number;
  list: { name: string; type: FilterInfo['type']; count: number }[];
  info: FilterInfo | null;
  direction?: 'horizontal' | 'vertical';
  onSelect: (info: FilterInfo) => void;
  onDelete: () => void;
}
export const FilterParamsBlock: React.FC<FilterParamsBlockProps> = React.memo(
  (props) => {
    const direction = props.direction ?? 'vertical';
    const { t } = useTranslation();
    const [filterText, setFilterText] = useState('');

    const filteredMetrics = props.list
      .filter((item) => item.type !== 'array') // TODO: not support array type yet
      .filter((item) => item.name.includes(filterText));

    const moreEl = (
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              className="h-8 w-8 rounded-lg text-sm hover:bg-white"
              variant="ghost"
              size="icon"
            >
              <LuEllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                props.onDelete();
              }}
            >
              <LuTrash2 className="mr-2" />
              {t('Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );

    return (
      <div
        className={cn(
          'flex cursor-pointer gap-1 rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700',
          direction === 'horizontal'
            ? 'w-auto flex-row items-center'
            : 'w-full flex-col'
        )}
      >
        {/* Params */}
        <DropdownSelect
          dropdownSize="default"
          defaultIsOpen={props.info === null}
          list={filteredMetrics}
          value={props.info?.name ?? ''}
          onSelect={(name, item) => {
            props.onSelect({
              value: null,
              ...props.info,
              operator: defaultOperators[item.type],
              type: item.type,
              name: name,
            });
          }}
          onSelectEmpty={props.onDelete}
          dropdownHeader={
            <div className="mb-2">
              <Input
                placeholder={t('Search...')}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          }
          renderItem={(item) => (
            <>
              <DataTypeIcon type={item.type} />
              <span>{item.name}</span>
            </>
          )}
        >
          <div className="flex items-center justify-between">
            <PopoverTrigger asChild>
              <div className="hover:bg-muted flex w-full flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 py-1">
                <DataTypeIcon type={props.info?.type} />
                <span>{props.info?.name ?? <>&nbsp;</>}</span>
              </div>
            </PopoverTrigger>

            {direction === 'vertical' && moreEl}
          </div>
        </DropdownSelect>

        {props.info && (
          <FilterParamsOperator info={props.info} onSelect={props.onSelect} />
        )}

        {direction === 'horizontal' && moreEl}
      </div>
    );
  }
);
FilterParamsBlock.displayName = 'FilterParamsBlock';
