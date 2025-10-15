import { cn } from '@/utils/style';
import { useTranslation } from '@i18next-toolkit/react';
import React, { PropsWithChildren, useState } from 'react';
import { DatePicker, DatePickerRange } from '../DatePicker';
import { dateKeyToDateRange } from '@/utils/insights';

interface DateRangeSelectionProps {
  value: string;
  onChange: (val: string, dateRange: [Date, Date]) => void;
}
export const DateRangeSelection: React.FC<DateRangeSelectionProps> = React.memo(
  (props) => {
    const { value, onChange } = props;
    const { t } = useTranslation();
    const [customDateRange, setCustomDateRange] = useState<
      DatePickerRange | undefined
    >(undefined);

    const handleDateKeyClick = (dateKey: string) => {
      const dateRange = dateKeyToDateRange(dateKey);
      if (dateRange) {
        onChange(dateKey, dateRange);
      }
    };

    return (
      <div>
        <div className="border-muted flex w-fit overflow-hidden rounded-lg border">
          <DatePicker
            className={cn(
              'w-[240px] rounded-none border-0 border-r',
              value === 'custom' && '!bg-muted'
            )}
            placeholder={t('Custom Date')}
            value={customDateRange}
            onChange={(value) => {
              setCustomDateRange(value);
              if (value?.from && value.to) {
                onChange('custom', [value.from, value.to]);
              }
            }}
          />
          <DateRangeSelectionItem
            selected={value === 'today'}
            onClick={() => handleDateKeyClick('today')}
          >
            {t('Today')}
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === 'yesterday'}
            onClick={() => handleDateKeyClick('yesterday')}
          >
            {t('Yesterday')}
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '3D'}
            onClick={() => handleDateKeyClick('3D')}
          >
            3D
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '7D'}
            onClick={() => handleDateKeyClick('7D')}
          >
            7D
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '30D'}
            onClick={() => handleDateKeyClick('30D')}
          >
            30D
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '3M'}
            onClick={() => handleDateKeyClick('3M')}
          >
            3M
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '6M'}
            onClick={() => handleDateKeyClick('6M')}
          >
            6M
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '12M'}
            onClick={() => handleDateKeyClick('12M')}
          >
            12M
          </DateRangeSelectionItem>
        </div>
      </div>
    );
  }
);
DateRangeSelection.displayName = 'DateRangeSelection';

const DateRangeSelectionItem: React.FC<
  PropsWithChildren<{ selected: boolean; onClick: () => void }>
> = React.memo((props) => {
  return (
    <div
      className={cn(
        'border-muted hover:bg-muted cursor-pointer text-nowrap border-r px-3 py-2 text-sm last:border-0',
        props.selected && 'bg-muted'
      )}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
});
DateRangeSelectionItem.displayName = 'DateRangeSelectionItem';
