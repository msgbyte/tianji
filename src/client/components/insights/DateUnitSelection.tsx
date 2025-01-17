import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { DateUnit } from '@tianji/shared';
import { useTranslation } from '@i18next-toolkit/react';

interface DateRangeSelectionProps {
  value: DateUnit;
  onChange: (val: DateUnit) => void;
}
export const DateUnitSelection: React.FC<DateRangeSelectionProps> = React.memo(
  (props) => {
    const { value, onChange } = props;
    const { t } = useTranslation();

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="minute">{t('Minute')}</SelectItem>
          <SelectItem value="hour">{t('Hour')}</SelectItem>
          <SelectItem value="day">{t('Day')}</SelectItem>
          <SelectItem value="month">{t('Month')}</SelectItem>
          <SelectItem value="year">{t('Year')}</SelectItem>
        </SelectContent>
      </Select>
    );
  }
);
DateUnitSelection.displayName = 'DateUnitSelection';
