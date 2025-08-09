import { cn } from '@/utils/style';
import { useTranslation } from '@i18next-toolkit/react';
import dayjs from 'dayjs';
import React, { PropsWithChildren, useState } from 'react';
import { DatePicker, DatePickerRange } from '../DatePicker';

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

    const handleChange = (val: string, dateRange: [Date, Date]) => {
      onChange(val, dateRange);
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
                handleChange('custom', [value.from, value.to]);
              }
            }}
          />
          <DateRangeSelectionItem
            selected={value === 'today'}
            onClick={() =>
              onChange('today', [
                dayjs().startOf('day').toDate(),
                dayjs().endOf('day').toDate(),
              ])
            }
          >
            {t('Today')}
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === 'yesterday'}
            onClick={() =>
              onChange('yesterday', [
                dayjs().subtract(1, 'day').startOf('day').toDate(),
                dayjs().subtract(1, 'day').endOf('day').toDate(),
              ])
            }
          >
            {t('Yesterday')}
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '3D'}
            onClick={() =>
              onChange('3D', [
                dayjs().subtract(3, 'day').startOf('day').toDate(),
                dayjs().endOf('day').toDate(),
              ])
            }
          >
            3D
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '7D'}
            onClick={() =>
              onChange('7D', [
                dayjs().subtract(7, 'day').startOf('day').toDate(),
                dayjs().endOf('day').toDate(),
              ])
            }
          >
            7D
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '30D'}
            onClick={() =>
              onChange('30D', [
                dayjs().subtract(30, 'day').startOf('day').toDate(),
                dayjs().endOf('day').toDate(),
              ])
            }
          >
            30D
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '3M'}
            onClick={() =>
              onChange('3M', [
                dayjs().subtract(3, 'month').startOf('day').toDate(),
                dayjs().endOf('day').toDate(),
              ])
            }
          >
            3M
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '6M'}
            onClick={() =>
              onChange('6M', [
                dayjs().subtract(6, 'month').startOf('day').toDate(),
                dayjs().endOf('day').toDate(),
              ])
            }
          >
            6M
          </DateRangeSelectionItem>
          <DateRangeSelectionItem
            selected={value === '12M'}
            onClick={() =>
              onChange('12M', [
                dayjs().subtract(12, 'month').startOf('day').toDate(),
                dayjs().endOf('day').toDate(),
              ])
            }
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
