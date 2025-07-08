import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { TimeEventChartType } from '../chart/TimeEventChart';
import { useTranslation } from '@i18next-toolkit/react';
import { LuChartArea, LuChartLine, LuChartPie } from 'react-icons/lu';

interface ChartTypeSelectionProps {
  value: TimeEventChartType;
  onChange: (val: TimeEventChartType) => void;
}
export const ChartTypeSelection: React.FC<ChartTypeSelectionProps> = React.memo(
  (props) => {
    const { value, onChange } = props;
    const { t } = useTranslation();

    const getIcon = () => {
      switch (value) {
        case 'line':
          return <LuChartLine />;
        case 'area':
          return <LuChartArea />;
        case 'stack':
          return <LuChartArea />;
        case 'pie':
          return <LuChartPie />;
        default:
          return <LuChartArea />;
      }
    };

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[60px]">{getIcon()}</SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="line">{t('Line')}</SelectItem>
          <SelectItem value="area">{t('Area')}</SelectItem>
          <SelectItem value="stack">{t('Stack')}</SelectItem>
          <SelectItem value="pie">{t('Pie')}</SelectItem>
        </SelectContent>
      </Select>
    );
  }
);
ChartTypeSelection.displayName = 'ChartTypeSelection';
