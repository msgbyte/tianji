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

interface BasicListItem {
  name: string;
  label?: string;
}

interface DropdownSelectProps<T> extends PropsWithChildren {
  label?: string;
  dropdownHeader?: React.ReactNode;
  dropdownSize?: 'default' | 'lg';
  defaultIsOpen?: boolean;
  list: T[];
  value: string;
  onSelect: (name: string, item: T) => void;
  onSelectEmpty?: () => void;
  renderItem?: (item: T) => React.ReactNode;
}
export const DropdownSelect = <T extends BasicListItem>(
  props: DropdownSelectProps<T>
) => {
  const [isOpen, setIsOpen] = useState(props.defaultIsOpen ?? false);
  const { t } = useTranslation();
  const dropdownSize = props.dropdownSize ?? 'default';

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (!props.value) {
          props.onSelectEmpty?.();
        }
        setIsOpen(open);
      }}
    >
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
        <div className="flex h-full flex-col">
          <div>{props.dropdownHeader}</div>

          <ScrollArea className="flex-1">
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
                      props.onSelect(item.name, item);
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
        </div>
      </PopoverContent>
    </Popover>
  );
};
DropdownSelect.displayName = 'DropdownSelect';
