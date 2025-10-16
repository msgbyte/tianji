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
  allowMinute: boolean;
  allowHour: boolean;
  value: DateUnit;
  onChange: (val: DateUnit) => void;
}
export const DateUnitSelection: React.FC<DateRangeSelectionProps> = React.memo(
  (props) => {
    const { allowMinute, allowHour, value, onChange } = props;
    const { t } = useTranslation();

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="minute" disabled={!allowMinute}>
            {t('Minute')}
          </SelectItem>
          <SelectItem value="hour" disabled={!allowHour}>
            {t('Hour')}
          </SelectItem>
          <SelectItem value="day">{t('Day')}</SelectItem>
          <SelectItem value="month">{t('Month')}</SelectItem>
          <SelectItem value="year">{t('Year')}</SelectItem>
        </SelectContent>
      </Select>
    );
  }
);
DateUnitSelection.displayName = 'DateUnitSelection';
