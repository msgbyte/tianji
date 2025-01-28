import React, { PropsWithChildren, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LuChevronDown } from 'react-icons/lu';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/utils/style';
import { useTranslation } from '@i18next-toolkit/react';

interface DropdownSelectProps<T = { name: string; label?: string }, P = string>
  extends PropsWithChildren {
  label?: string;
  dropdownHeader?: React.ReactNode;
  dropdownSize?: 'default' | 'lg';
  list: T[];
  value: P;
  onSelect: (name: P) => void;
  renderItem?: (item: T) => React.ReactNode;
}
export const DropdownSelect: React.FC<DropdownSelectProps> = React.memo(
  (props) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();
    const dropdownSize = props.dropdownSize ?? 'default';

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {props.children ?? (
          <PopoverTrigger asChild>
            <div className="hover:bg-muted flex items-center gap-1 rounded-lg px-2 py-1 text-xs opacity-60">
              <span>{props.label ?? <>&nbsp;</>}</span>
              <LuChevronDown />
            </div>
          </PopoverTrigger>
        )}

        <PopoverContent
          align="start"
          className={cn({
            'h-[280px] w-[310px]': dropdownSize === 'default',
            'h-[320px] w-[380px]': dropdownSize === 'lg',
          })}
        >
          {props.dropdownHeader}

          <ScrollArea>
            {props.list.length === 0 && (
              <div className="mt-4 text-center opacity-80">
                {t('No any item availabled.')}
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              {props.list.map((item, i) => {
                return (
                  <div
                    key={i}
                    className={cn(
                      'hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm transition-all',
                      props.value === item.name && 'bg-muted'
                    )}
                    onClick={() => {
                      props.onSelect(item.name);
                      setIsOpen(false);
                    }}
                  >
                    {props.renderItem ? (
                      props.renderItem(item)
                    ) : (
                      <span>{item.label ?? item.name}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    );
  }
);
DropdownSelect.displayName = 'DropdownSelect';
