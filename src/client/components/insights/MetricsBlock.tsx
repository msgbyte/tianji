import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '../ui/input';
import { useTranslation } from '@i18next-toolkit/react';
import { formatNumber, numberToLetter } from '@/utils/common';
import {
  LuChevronDown,
  LuDelete,
  LuMoreVertical,
  LuMousePointerClick,
  LuTrain,
  LuTrash,
  LuTrash2,
} from 'react-icons/lu';
import { MetricsInfo } from '@/store/insights';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/utils/style';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { DropdownSelect } from './DropdownSelect';

interface MetricsBlockProps {
  index: number;
  list: { name: string; count: number }[];
  info: MetricsInfo | null;
  onSelect: (info: MetricsInfo) => void;
  onDelete: () => void;
}
export const MetricsBlock: React.FC<MetricsBlockProps> = React.memo((props) => {
  const { t } = useTranslation();
  const [isMetricOpen, setIsMetricOpen] = useState(props.info === null);
  const [isMathOpen, setIsMathOpen] = useState(false);
  const [filterText, setFilterText] = useState('');

  const mathMethod = [
    {
      label: t('Total Events'),
      name: 'events',
    },
    {
      label: t('Total Session'),
      name: 'sessions',
    },
  ] satisfies {
    label: string;
    name: MetricsInfo['math'];
  }[];

  const selectedMathMethodLabel =
    mathMethod.find((m) => m.name === props.info?.math)?.label ??
    mathMethod[0].label;

  const filteredMetrics = props.list.filter((item) =>
    item.name.includes(filterText)
  );

  return (
    <div className="border-muted flex w-full cursor-pointer flex-col gap-1 rounded-lg border px-2 py-1">
      {/* Event */}
      <DropdownSelect
        dropdownSize="lg"
        list={filteredMetrics}
        value={props.info?.name ?? ''}
        onSelect={(name: string) => {
          props.onSelect({
            math: 'events',
            ...props.info,
            name: name,
          });
        }}
        dropdownHeader={
          <div className="mb-2">
            <Input
              placeholder={t('Search Metrics')}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        }
        renderItem={(item) => (
          <>
            <LuMousePointerClick />
            <span>{item.name}</span>
            <span className="text-xs opacity-40">
              ({formatNumber((item as any).count)})
            </span>
          </>
        )}
      >
        <div className="flex items-center justify-between">
          <PopoverTrigger asChild>
            <div className="hover:bg-muted flex w-full flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 py-1">
              <div className="h-4 w-4 rounded bg-white bg-opacity-20 text-center text-xs">
                {numberToLetter(props.index + 1)}
              </div>
              <span>{props.info?.name ?? <>&nbsp;</>}</span>
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
                  <LuMoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
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

      {/* Math */}
      {props.info && props.info.name && (
        <DropdownSelect
          label={selectedMathMethodLabel}
          dropdownHeader={
            <div className="mb-2 px-1 text-xs opacity-40">{t('Measuring')}</div>
          }
          list={mathMethod}
          value={props.info?.math}
          onSelect={(name) => {
            props.onSelect({
              name: '$all_event',
              ...props.info,
              math: name as any,
            });
          }}
        />
      )}
    </div>
  );
});
MetricsBlock.displayName = 'MetricsBlock';
