import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { TimeEventChartType } from '../chart/TimeEventChart';
import { useTranslation } from '@i18next-toolkit/react';
import {
  LuChartArea,
  LuChartBar,
  LuChartLine,
  LuChartPie,
} from 'react-icons/lu';

interface ChartTypeSelectionProps {
  value: TimeEventChartType;
  onChange: (val: TimeEventChartType) => void;
}
export const ChartTypeSelection: React.FC<ChartTypeSelectionProps> = React.memo(
  (props) => {
    const { value, onChange } = props;
    const { t } = useTranslation();

    const chartTypes = [
      { value: 'line' as const, label: t('Line Chart'), icon: <LuChartLine /> },
      { value: 'area' as const, label: t('Area Chart'), icon: <LuChartArea /> },
      {
        value: 'stack' as const,
        label: t('Stack Chart'),
        icon: <LuChartArea />,
      },
      { value: 'bar' as const, label: t('Bar Chart'), icon: <LuChartBar /> },
      { value: 'pie' as const, label: t('Pie Chart'), icon: <LuChartPie /> },
    ];

    const getIcon = (type: TimeEventChartType) => {
      const chartType = chartTypes.find((item) => item.value === type);
      return chartType?.icon || <LuChartArea />;
    };

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[60px]">{getIcon(value)}</SelectTrigger>
        <SelectContent align="end">
          {chartTypes.map((chartType) => (
            <SelectItem key={chartType.value} value={chartType.value}>
              <div className="flex items-center gap-1">
                {chartType.icon}
                <span>{t(chartType.label)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);
ChartTypeSelection.displayName = 'ChartTypeSelection';
