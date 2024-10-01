import { useTheme } from '../hooks/useTheme';
import { DateUnit } from '@tianji/shared';
import React from 'react';
import { formatDateWithUnit } from '../utils/date';
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
} from './ui/chart';
import { useStrokeDasharray } from '@/hooks/useStrokeDasharray';

const chartConfig = {
  pv: {
    label: 'PV',
  },
  uv: {
    label: 'UV',
  },
} satisfies ChartConfig;

export const TimeEventChart: React.FC<{
  labelMapping?: Record<string, string>;
  data: { date: string; [key: string]: number | string }[];
  unit: DateUnit;
}> = React.memo((props) => {
  const { colors } = useTheme();
  const [calcStrokeDasharray, strokes] = useStrokeDasharray({});
  const [strokeDasharray, setStrokeDasharray] = React.useState([...strokes]);
  const handleAnimationEnd = () => setStrokeDasharray([...strokes]);
  const getStrokeDasharray = (name: string) => {
    const lineDasharray = strokeDasharray.find((s) => s.name === name);
    return lineDasharray ? lineDasharray.strokeDasharray : undefined;
  };

  return (
    <ChartContainer config={chartConfig}>
      <AreaChart
        data={props.data}
        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.chart.pv} stopOpacity={0.8} />
            <stop offset="95%" stopColor={colors.chart.pv} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.chart.uv} stopOpacity={0.8} />
            <stop offset="95%" stopColor={colors.chart.uv} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Customized component={calcStrokeDasharray} />
        <XAxis
          dataKey="date"
          tickFormatter={(text) => formatDateWithUnit(text, props.unit)}
        />
        <YAxis mirror />
        <ChartLegend content={<ChartLegendContent />} />
        <CartesianGrid vertical={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="pv"
          stroke={colors.chart.pv}
          fillOpacity={1}
          fill="url(#colorUv)"
          strokeWidth={2}
          strokeDasharray={getStrokeDasharray('pv')}
          onAnimationEnd={handleAnimationEnd}
        />
        <Area
          type="monotone"
          dataKey="uv"
          stroke={colors.chart.uv}
          fillOpacity={1}
          fill="url(#colorPv)"
          strokeWidth={2}
          strokeDasharray={getStrokeDasharray('uv')}
          onAnimationEnd={handleAnimationEnd}
        />
      </AreaChart>
    </ChartContainer>
  );
});
TimeEventChart.displayName = 'TimeEventChart';
