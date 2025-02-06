import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { cn } from '@/utils/style';
import { DateRange } from 'react-day-picker';
import { LuCalendar } from 'react-icons/lu';
import dayjs from 'dayjs';
import { useTranslation } from '@i18next-toolkit/react';
import { Calendar } from './ui/calendar';

interface DatePickerProps {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
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
            !props.value && 'text-muted-foreground'
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
          onSelect={props.onChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
});
DatePicker.displayName = 'DatePicker';
