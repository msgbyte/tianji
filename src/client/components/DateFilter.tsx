import React, { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DateRange, useGlobalStateStore } from '../store/global';
import { useGlobalRangeDate } from '../hooks/useGlobalRangeDate';
import { useTranslation } from '@i18next-toolkit/react';
import { cn } from '@/utils/style';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { DatePicker } from './DatePicker';

interface DateFilterProps {
  className?: string;
}
export const DateFilter: React.FC<DateFilterProps> = React.memo((props) => {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const { label, startDate, endDate } = useGlobalRangeDate();
  const [range, setRange] = useState<[Dayjs, Dayjs]>([startDate, endDate]);

  const handleSelectChange = (value: string) => {
    if (value === 'custom') {
      setShowPicker(true);
    } else {
      useGlobalStateStore.setState({
        dateRange: value as unknown as DateRange,
      });
    }
  };

  return (
    <>
      <Select onValueChange={handleSelectChange}>
        <SelectTrigger
          className={cn(
            'w-fit min-w-[150px] max-w-[320px] text-right',
            props.className
          )}
        >
          <div className="flex w-full items-center justify-between">
            <SelectValue placeholder={label}>{label}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={String(DateRange.Realtime)}>
              {t('Realtime')}
            </SelectItem>
            <SelectSeparator />
            <SelectItem value={String(DateRange.Today)}>
              {t('Today')}
            </SelectItem>
            <SelectItem value={String(DateRange.Last24Hours)}>
              {t('Last 24 Hours')}
            </SelectItem>
            <SelectItem value={String(DateRange.Yesterday)}>
              {t('Yesterday')}
            </SelectItem>
            <SelectSeparator />
            <SelectItem value={String(DateRange.ThisWeek)}>
              {t('This week')}
            </SelectItem>
            <SelectItem value={String(DateRange.Last7Days)}>
              {t('Last 7 days')}
            </SelectItem>
            <SelectSeparator />
            <SelectItem value={String(DateRange.ThisMonth)}>
              {t('This Month')}
            </SelectItem>
            <SelectItem value={String(DateRange.Last30Days)}>
              {t('Last 30 days')}
            </SelectItem>
            <SelectItem value={String(DateRange.Last90Days)}>
              {t('Last 90 days')}
            </SelectItem>
            <SelectItem value={String(DateRange.ThisYear)}>
              {t('This year')}
            </SelectItem>
            <SelectSeparator />
            <SelectItem value="custom">{t('Custom')}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {showPicker && (
        <Dialog open={showPicker} onOpenChange={setShowPicker}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Select your date range')}</DialogTitle>
            </DialogHeader>
            <div className="flex py-4">
              <DatePicker
                value={{
                  from: range[0].toDate(),
                  to: range[1].toDate(),
                }}
                onChange={(value) => {
                  if (value?.from && value.to) {
                    setRange([dayjs(value.from), dayjs(value.to)]);
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  useGlobalStateStore.setState({
                    dateRange: DateRange.Custom,
                    startDate: range[0],
                    endDate: range[1],
                  });
                  setShowPicker(false);
                }}
              >
                {t('OK')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});
DateFilter.displayName = 'DateFilter';
