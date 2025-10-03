import React, { useMemo, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { DateUnit } from '@tianji/shared';
import { formatDateWithUnit } from '../../utils/date';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';
import { get } from 'lodash-es';
import { cn } from '@/utils/style';
import { type AxisDomain } from 'recharts/types/util/types';
import { TimeEventChartData } from './TimeEventChart';

export const TimeEventBarChart: React.FC<{
  className?: string;
  data: TimeEventChartData[];
  unit: DateUnit;
  yAxisDomain?: AxisDomain;
  chartConfig: ChartConfig;
  stacked?: boolean;
  isTrendingMode?: boolean;
  showDifference?: boolean;
  valueFormatter?: (value: number) => string;
  xAxisLabelFormatter?: (value: string) => string;
  tooltipLabelFormatter?: (value: string) => string;
}> = React.memo((props) => {
  const {
    className,
    data,
    unit,
    yAxisDomain,
    chartConfig,
    stacked = false,
    isTrendingMode = false,
    showDifference = false,
    valueFormatter,
    xAxisLabelFormatter,
    tooltipLabelFormatter,
  } = props;
  const { colors } = useTheme();
  const [selectedItem, setSelectedItem] = useState<string[]>(() =>
    Object.keys(chartConfig)
  );

  return (
    <ChartContainer className={className} config={chartConfig}>
      <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tickFormatter={(text) =>
            xAxisLabelFormatter
              ? xAxisLabelFormatter(String(text))
              : formatDateWithUnit(text, unit)
          }
        />
        <YAxis
          mirror
          domain={isTrendingMode ? ['auto', 'auto'] : yAxisDomain}
          tickFormatter={valueFormatter}
        />
        <ChartLegend
          content={
            <ChartLegendContent
              selectedItem={selectedItem}
              onItemClick={(item) => {
                setSelectedItem((selected) => {
                  if (selected.includes(item.value)) {
                    return selected.filter((s) => s !== item.value);
                  } else {
                    return [...selected, item.value];
                  }
                });
              }}
            />
          }
        />
        <CartesianGrid vertical={false} />

        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) =>
                tooltipLabelFormatter
                  ? tooltipLabelFormatter(String(label))
                  : formatDateWithUnit(label, unit)
              }
              valueFormatter={valueFormatter}
              formatter={
                showDifference
                  ? (value, name, item, _index, payload, content) => {
                      const index = data.indexOf(payload);
                      // Calculate difference with previous data point
                      if (index > 0 && data.length > 1) {
                        const currentValue = value as number;
                        const prevValue = Number(get(data, [index - 1, name]));
                        const diff = currentValue - prevValue;
                        const diffFormat = valueFormatter
                          ? valueFormatter(diff)
                          : diff.toLocaleString();

                        const diffText =
                          diff > 0 ? `+${diffFormat}` : diffFormat;

                        const diffColor =
                          diff > 0
                            ? 'text-green-500'
                            : diff < 0
                              ? 'text-red-500'
                              : 'text-gray-500';

                        return (
                          <div className="flex items-center gap-2">
                            {content}
                            <span
                              className={cn('font-mono text-xs', diffColor)}
                            >
                              {diffText}
                            </span>
                          </div>
                        );
                      }

                      return <>{content}</>;
                    }
                  : undefined
              }
            />
          }
        />

        {Object.keys(chartConfig).map((key, i) => {
          const color =
            chartConfig[key].color ??
            (colors.chart as any)[key] ??
            colors.chart.default;

          return (
            <Bar
              key={key}
              hide={!selectedItem.includes(key)}
              dataKey={key}
              stackId={stacked ? '1' : undefined}
              fill={color}
              stroke={color}
              strokeWidth={1}
              radius={[2, 2, 0, 0]}
            />
          );
        })}
      </BarChart>
    </ChartContainer>
  );
});
TimeEventBarChart.displayName = 'TimeEventBarChart';
