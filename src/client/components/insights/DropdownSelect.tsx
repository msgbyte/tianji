import React, { PropsWithChildren, useState, useMemo } from 'react';
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
  filterText?: string; // Optional filter text for internal filtering
  allowCustomInput?: boolean;
}
export const DropdownSelect = <T extends BasicListItem>(
  props: DropdownSelectProps<T>
) => {
  const [isOpen, setIsOpen] = useState(props.defaultIsOpen ?? false);
  const { t } = useTranslation();
  const dropdownSize = props.dropdownSize ?? 'default';
  const allowCustomInput = props.allowCustomInput ?? true;

  // Filter list based on filterText if provided
  const filteredList = useMemo(() => {
    if (!props.filterText) {
      return props.list;
    }
    return props.list.filter(
      (item) =>
        item.name.toLowerCase().includes(props.filterText!.toLowerCase()) ||
        (item.label &&
          item.label.toLowerCase().includes(props.filterText!.toLowerCase()))
    );
  }, [props.list, props.filterText]);

  // Check if we should show the specify option
  const shouldShowSpecify = useMemo(() => {
    return (
      allowCustomInput && props.filterText && props.filterText.trim().length > 0
    );
  }, [allowCustomInput, props.filterText]);

  const handleSpecifySelect = () => {
    if (shouldShowSpecify) {
      // Create a custom item with the filterText as name
      const customItem = {
        name: props.filterText!.trim(),
        label: props.filterText!.trim(),
      } as T;
      props.onSelect(props.filterText!.trim(), customItem);
      setIsOpen(false);
    }
  };

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
            {shouldShowSpecify && (
              <div
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm transition-all"
                onClick={handleSpecifySelect}
              >
                <span className="text-primary">
                  {t('Specify')}: <strong>{props.filterText!.trim()}</strong>
                </span>
              </div>
            )}

            {filteredList.length === 0 ? (
              <div className="mt-4 text-center opacity-80">
                {props.filterText
                  ? t('No items match your search.')
                  : t('No any item availabled.')}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filteredList.map((item, i) => {
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
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
DropdownSelect.displayName = 'DropdownSelect';
