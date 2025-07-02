import React, { useState, useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/style';
import { useTranslation } from '@i18next-toolkit/react';
import { LuChevronDown, LuX } from 'react-icons/lu';

interface MultiSelectItem {
  value: string;
  label?: string;
  disabled?: boolean;
}

interface MultiSelectPopoverProps {
  /** Label displayed on the trigger */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** List of available options */
  options: MultiSelectItem[];
  /** Currently selected values */
  selectedValues: string[];
  /** Whether to use single select mode */
  singleSelect?: boolean;
  /** Whether to allow custom input */
  allowCustomInput?: boolean;
  /** Whether to show select all button */
  showSelectAll?: boolean;
  /** Custom class name for trigger */
  triggerClassName?: string;
  /** Custom class name for popover */
  popoverClassName?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Callback when values change */
  onValueChange: (values: string[]) => void;
  /** Custom trigger content */
  children?: React.ReactNode;
}

export const MultiSelectPopover: React.FC<MultiSelectPopoverProps> = (
  props
) => {
  const { t } = useTranslation();
  const {
    label,
    placeholder = t('Select items...'),
    options = [],
    selectedValues = [],
    singleSelect = false,
    allowCustomInput = true,
    showSelectAll = true,
    triggerClassName,
    popoverClassName,
    disabled = false,
    onValueChange,
    children,
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Create dynamic options list that includes selected custom values
  const dynamicOptions = useMemo(() => {
    const originalValues = options.map((option) => option.value);
    const customSelectedValues = selectedValues.filter(
      (value) => !originalValues.includes(value)
    );

    const customOptions: MultiSelectItem[] = customSelectedValues.map(
      (value) => ({
        value,
        label: value,
      })
    );

    return [...options, ...customOptions];
  }, [options, selectedValues]);

  const filteredOptions = useMemo(() => {
    if (!searchText) return dynamicOptions;
    return dynamicOptions.filter(
      (option) =>
        option.label?.toLowerCase().includes(searchText.toLowerCase()) ||
        option.value.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [dynamicOptions, searchText]);

  const isAllSelected = useMemo(() => {
    if (filteredOptions.length === 0) return false;
    return filteredOptions.every((option) =>
      selectedValues.includes(option.value)
    );
  }, [filteredOptions, selectedValues]);

  const handleOptionToggle = (value: string) => {
    if (singleSelect) {
      onValueChange([value]);
      setIsOpen(false);
    } else {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onValueChange(newValues);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      const filteredValues = filteredOptions.map((option) => option.value);
      const newValues = selectedValues.filter(
        (value) => !filteredValues.includes(value)
      );
      onValueChange(newValues);
    } else {
      const filteredValues = filteredOptions.map((option) => option.value);
      const newValues = [...new Set([...selectedValues, ...filteredValues])];
      onValueChange(newValues);
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
    setSearchText('');
  };

  const handleRemoveItem = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValues = selectedValues.filter((v) => v !== value);
    onValueChange(newValues);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {children || (
          <div
            className={cn(
              'border-input bg-background ring-offset-background focus:ring-ring flex min-h-9 w-full cursor-pointer items-center justify-between rounded-md border px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              triggerClassName
            )}
          >
            <div className="flex flex-1 flex-wrap gap-1">
              {label && <span className="text-muted-foreground">{label}:</span>}
              {selectedValues.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedValues.slice(0, 3).map((value) => (
                    <div
                      key={value}
                      className="bg-secondary flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                    >
                      <span>{value}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveItem(value, e)}
                        className="hover:text-destructive ml-1"
                      >
                        <LuX size={12} />
                      </button>
                    </div>
                  ))}
                  {selectedValues.length > 3 && (
                    <div className="bg-secondary flex items-center rounded px-2 py-0.5 text-xs">
                      +{selectedValues.length - 3} more
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <LuChevronDown className="h-4 w-4 opacity-50" />
          </div>
        )}
      </PopoverTrigger>

      <PopoverContent
        className={cn('w-80 p-0', popoverClassName)}
        align="start"
      >
        <div className="flex h-96 flex-col">
          <div className="border-b p-3">
            <Input
              placeholder={t('Search...')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-9"
            />
          </div>

          <ScrollArea className="flex-1 p-2">
            {!singleSelect && showSelectAll && filteredOptions.length > 0 && (
              <div className="mb-2">
                <div
                  className="hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-2"
                  onClick={handleSelectAll}
                >
                  <Checkbox
                    checked={isAllSelected}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <span className="text-primary text-sm font-medium">
                    {isAllSelected ? t('Deselect all') : t('Select all')}
                  </span>
                </div>
              </div>
            )}

            {allowCustomInput &&
            filteredOptions.length === 0 &&
            searchText.trim().length !== 0 ? (
              <div className="space-y-1">
                <div
                  className="hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-2"
                  onClick={() => handleOptionToggle(searchText.trim())}
                >
                  <Checkbox
                    checked={selectedValues.includes(searchText.trim())}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <span className="text-sm">
                    {t('Specify')}: <strong>{searchText.trim()}</strong>
                  </span>
                </div>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-muted-foreground py-6 text-center text-sm">
                {t('No options found')}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        'hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-2',
                        option.disabled && 'cursor-not-allowed opacity-50'
                      )}
                      onClick={() =>
                        !option.disabled && handleOptionToggle(option.value)
                      }
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={option.disabled}
                        className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <span className="text-sm">
                        {option.label || option.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-3">
            <Button onClick={handleConfirm} className="w-full">
              {singleSelect ? t('Select') : t('Apply')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
MultiSelectPopover.displayName = 'MultiSelectPopover';
