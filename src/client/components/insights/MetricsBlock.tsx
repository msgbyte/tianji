import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '../ui/input';
import { useTranslation } from '@i18next-toolkit/react';
import { formatNumber, numberToLetter } from '@/utils/common';
import { LuMousePointerClick } from 'react-icons/lu';
import { MetricsInfo } from '@/store/insights';
import { ScrollArea } from '../ui/scroll-area';

interface MetricsBlockProps {
  index: number;
  list: { name: string; count: number }[];
  info: MetricsInfo | null;
  onSelect: (info: MetricsInfo) => void;
}
export const MetricsBlock: React.FC<MetricsBlockProps> = React.memo((props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="border-muted hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2 py-1">
            <div className="h-4 w-4 rounded bg-white bg-opacity-20 text-center text-xs">
              {numberToLetter(props.index + 1)}
            </div>
            <span>{props.info?.name ?? <>&nbsp;</>}</span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="h-[320px] w-[380px]">
          <div className="mb-2">
            <Input placeholder={t('Search Metrics')} />
          </div>

          <ScrollArea>
            {props.list.map((item, i) => {
              return (
                <div
                  key={i}
                  className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1"
                  onClick={() => {
                    props.onSelect({
                      name: item.name,
                    });
                    setOpen(false);
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
    </div>
  );
});
MetricsBlock.displayName = 'MetricsBlock';
