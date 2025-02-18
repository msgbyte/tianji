import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { cn } from '@/utils/style';
import { LuCalendar } from 'react-icons/lu';
import dayjs from 'dayjs';
import { useTranslation } from '@i18next-toolkit/react';
import { Calendar } from './ui/calendar';

export type DatePickerRange = {
  from: Date | undefined;
  to: Date | undefined;
};

interface DatePickerProps {
  className?: string;
  value: DatePickerRange | undefined;
  onChange: (value: DatePickerRange | undefined) => void;
}
export const DatePicker: React.FC<DatePickerProps> = React.memo((props) => {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={'outline'}
          className={cn(
            'w-[300px] justify-start text-left font-normal',
            !props.value && 'text-muted-foreground',
            props.className
          )}
        >
          <LuCalendar className="mr-2 h-4 w-4" />
          {props.value?.from ? (
            props.value.to ? (
              <>
                {dayjs(props.value.from).format('MMM DD, YYYY')} -{' '}
                {dayjs(props.value.to).format('MMM DD, YYYY')}
              </>
            ) : (
              dayjs(props.value.from).format('MMM DD, YYYY')
            )
          ) : (
            <span>{t('Pick a date')}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={props.value?.from}
          selected={props.value}
          onSelect={(range) => {
            if (range) {
              props.onChange({
                from: dayjs(range.from).startOf('day').toDate(),
                to: dayjs(range.to ?? range.from)
                  .endOf('day')
                  .toDate(),
              });
            } else {
              props.onChange(undefined);
            }
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
});
DatePicker.displayName = 'DatePicker';
