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
import { GroupInfo } from '@tianji/shared';

interface BreakdownParamsBlockProps {
  index: number;
  list: { name: string; type: GroupInfo['type']; count: number }[];
  info: GroupInfo | null;
  onSelect: (info: GroupInfo) => void;
  onDelete: () => void;
}
export const BreakdownParamsBlock: React.FC<BreakdownParamsBlockProps> =
  React.memo((props) => {
    const { t } = useTranslation();
    const [filterText, setFilterText] = useState('');

    const metrics = props.list.filter((item) => item.type !== 'array'); // TODO: not support array type yet

    return (
      <div className="flex w-full cursor-pointer flex-col gap-1 rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700">
        {/* Params */}
        <DropdownSelect
          dropdownSize="default"
          defaultIsOpen={props.info === null}
          filterText={filterText}
          list={metrics}
          value={props.info?.value ?? ''}
          onSelect={(name, item) => {
            props.onSelect({
              ...props.info,
              value: name,
              type: item.type,
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
                <span>{props.info?.value ?? <>&nbsp;</>}</span>
              </div>
            </PopoverTrigger>

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
          </div>
        </DropdownSelect>

        {/* TODO */}
        {/* {props.info && (
          <FilterParamsOperator info={props.info} onSelect={props.onSelect} />
        )} */}
      </div>
    );
  });
BreakdownParamsBlock.displayName = 'BreakdownParamsBlock';
