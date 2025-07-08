import React, { useMemo } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { sumBy } from 'lodash-es';
import { ChartConfig } from '../ui/chart';
import { SimplePieChart } from './SimplePieChart';
import { TimeEventChartData } from './TimeEventChart';

export const TimeEventPieChart: React.FC<{
  className?: string;
  data: TimeEventChartData[];
  chartConfig: ChartConfig;
}> = React.memo((props) => {
  const { className, data, chartConfig } = props;
  const { colors } = useTheme();

  // Transform data for pie chart
  const pieData = useMemo(() => {
    const dataKeys = Object.keys(chartConfig);
    return dataKeys.map((key) => {
      const totalValue = sumBy(data, (item) => Number(item[key]) || 0);
      const color =
        chartConfig[key].color ??
        (colors.chart as any)[key] ??
        colors.chart.default;
      return {
        label: String(chartConfig[key].label || key),
        count: totalValue,
        fill: color,
      };
    });
  }, [data, chartConfig, colors]);

  return (
    <SimplePieChart
      className={className}
      data={pieData}
      chartConfig={chartConfig}
    />
  );
});
TimeEventPieChart.displayName = 'TimeEventPieChart';
