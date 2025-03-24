import { useTheme } from '../../hooks/useTheme';
import { DateUnit } from '@tianji/shared';
import React, { useMemo, useState } from 'react';
import { formatDateWithUnit } from '../../utils/date';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Customized,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';
import { useStrokeDasharray } from '@/hooks/useStrokeDasharray';
import { flatten, get, union, without } from 'lodash-es';
import { pickColorWithNum } from '@/utils/color';
import { cn } from '@/utils/style';

export type TimeEventChartType = 'area' | 'stack';

export type TimeEventChartData = {
  date: string;
  [key: string]: number | string;
};

const defaultChartConfig: ChartConfig = {
  pv: {
    label: 'PV',
  },
  uv: {
    label: 'UV',
  },
};

export const TimeEventChart: React.FC<{
  className?: string;
  data: TimeEventChartData[];
  unit: DateUnit;
  chartConfig?: ChartConfig;
  drawGradientArea?: boolean;
  drawDashLine?: boolean;
  chartType?: TimeEventChartType;
  isTrendingMode?: boolean;
  showDifference?: boolean;
}> = React.memo((props) => {
  const {
    className,
    drawGradientArea = true,
    drawDashLine = true,
    chartConfig = defaultChartConfig,
    chartType = 'area',
    isTrendingMode = false,
    showDifference = false,
  } = props;
  const { colors } = useTheme();
  const [calcStrokeDasharray, strokes] = useStrokeDasharray({});
  const [strokeDasharray, setStrokeDasharray] = useState([...strokes]);
  const handleAnimationEnd = () => setStrokeDasharray([...strokes]);
  const getStrokeDasharray = (name: string) => {
    const lineDasharray = strokeDasharray.find((s) => s.name === name);
    return lineDasharray ? lineDasharray.strokeDasharray : undefined;
  };
  const [selectedItem, setSelectedItem] = useState<string[]>(() =>
    Object.keys(chartConfig)
  );

  const stacked = chartType === 'stack';

  return (
    <ChartContainer className={className} config={chartConfig}>
      <AreaChart
        data={props.data}
        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
      >
        {drawGradientArea && (
          <defs>
            {Object.keys(chartConfig).map((key, i) => {
              const color =
                chartConfig[key].color ??
                (colors.chart as any)[key] ??
                colors.chart.default;

              return (
                <linearGradient
                  key={key}
                  id={`color-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
        )}

        {drawDashLine && <Customized component={calcStrokeDasharray} />}

        <XAxis
          dataKey="date"
          tickFormatter={(text) => formatDateWithUnit(text, props.unit)}
        />
        <YAxis mirror domain={isTrendingMode ? ['auto', 'auto'] : undefined} />
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
              labelFormatter={(label) => formatDateWithUnit(label, props.unit)}
              formatter={
                showDifference
                  ? (value, name, item, _index, payload, content) => {
                      const index = props.data.indexOf(payload);
                      // Calculate difference with previous data point
                      if (index > 0 && props.data.length > 1) {
                        const currentValue = value as number;
                        const prevValue = Number(
                          get(props.data, [index - 1, name])
                        );
                        const diff = currentValue - prevValue;
                        const diffText =
                          diff > 0
                            ? `+${diff.toLocaleString()}`
                            : diff.toLocaleString();
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
          return (
            <Area
              key={key}
              hide={!selectedItem.includes(key)}
              type="monotone"
              dataKey={key}
              stackId={stacked ? '1' : undefined}
              stroke={
                chartConfig[key].color ??
                (colors.chart as any)[key] ??
                colors.chart.default
              }
              fillOpacity={1}
              fill={`url(#color-${key})`}
              strokeWidth={2}
              strokeDasharray={getStrokeDasharray(key)}
              onAnimationEnd={handleAnimationEnd}
            />
          );
        })}
      </AreaChart>
    </ChartContainer>
  );
});
TimeEventChart.displayName = 'TimeEventChart';

export function useTimeEventChartConfig(chartData: TimeEventChartData[]) {
  const chartConfig = useMemo(() => {
    if (chartData.length === 0) {
      return {};
    }

    return without(
      union(flatten(chartData.map((c) => Object.keys(c)))),
      'date'
    ).reduce((prev, curr, i) => {
      return {
        ...prev,
        [curr]: {
          label: curr,
          color: pickColorWithNum(i),
        },
      };
    }, {});
  }, [chartData]);

  return chartConfig;
}
