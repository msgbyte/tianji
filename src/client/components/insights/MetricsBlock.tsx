import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '../ui/input';
import { useTranslation } from '@i18next-toolkit/react';
import { formatNumber, numberToLetter } from '@/utils/common';
import { LuChevronDown, LuMousePointerClick } from 'react-icons/lu';
import { MetricsInfo } from '@/store/insights';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/utils/style';

interface MetricsBlockProps {
  index: number;
  list: { name: string; count: number }[];
  info: MetricsInfo | null;
  onSelect: (info: MetricsInfo) => void;
}
export const MetricsBlock: React.FC<MetricsBlockProps> = React.memo((props) => {
  const { t } = useTranslation();
  const [isMetricOpen, setIsMetricOpen] = useState(false);
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

  return (
    <div className="border-muted flex w-full cursor-pointer flex-col gap-1 rounded-lg border px-2 py-1">
      {/* Event */}
      <Popover open={isMetricOpen} onOpenChange={setIsMetricOpen}>
        <PopoverTrigger asChild>
          <div className="hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1">
            <div className="h-4 w-4 rounded bg-white bg-opacity-20 text-center text-xs">
              {numberToLetter(props.index + 1)}
            </div>
            <span>{props.info?.name ?? <>&nbsp;</>}</span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="h-[320px] w-[380px]">
          <div className="mb-2">
            <Input
              placeholder={t('Search Metrics')}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <ScrollArea>
            {props.list
              .filter((item) => item.name.includes(filterText))
              .map((item, i) => {
                return (
                  <div
                    className={cn(
                      'hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1',
                      props.info?.name === item.name && 'bg-muted'
                    )}
                    onClick={() => {
                      props.onSelect({
                        math: 'events',
                        ...props.info,
                        name: item.name,
                      });
                      setIsMetricOpen(false);
                    }}
                  >
                    <LuMousePointerClick />
                    <span>{item.name}</span>
                    <span className="text-xs opacity-40">
                      ({formatNumber(item.count)})
                    </span>
                  </div>
                );
              })}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Math */}
      {props.info && props.info.name && (
        <Popover open={isMathOpen} onOpenChange={setIsMathOpen}>
          <PopoverTrigger asChild>
            <div className="hover:bg-muted flex items-center gap-1 rounded-lg px-2 py-1 text-xs opacity-60">
              <span>{selectedMathMethodLabel}</span>
              <LuChevronDown />
            </div>
          </PopoverTrigger>
          <PopoverContent className="h-[280px] w-[310px]">
            <div className="mb-2 px-1 text-xs opacity-40">{t('Measuring')}</div>
            <ScrollArea>
              {mathMethod.map((item, i) => {
                return (
                  <div
                    key={i}
                    className={cn(
                      'hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm',
                      props.info?.math === item.name && 'bg-muted'
                    )}
                    onClick={() => {
                      props.onSelect({
                        name: '$all_event',
                        ...props.info,
                        math: item.name,
                      });
                      setIsMathOpen(false);
                    }}
                  >
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});
MetricsBlock.displayName = 'MetricsBlock';
