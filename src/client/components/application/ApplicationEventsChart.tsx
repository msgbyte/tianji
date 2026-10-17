import React, { useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import type { DateUnit } from '@tianji/shared';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import type { AppRouterOutput } from '@/api/trpc';
import { formatDateWithUnit } from '@/utils/date';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';

// Reserve blue for sessions so the line stays distinct from event categories.
const EVENT_COLORS = [
  { light: '#76b7b2', dark: '#4f8f8a' },
  { light: '#f28e2b', dark: '#c9792f' },
  { light: '#ab95dd', dark: '#7d6bb8' },
  { light: '#59a14f', dark: '#4f8a47' },
  { light: '#edc948', dark: '#c2a542' },
  { light: '#e15759', dark: '#b94d50' },
  { light: '#b07aa1', dark: '#8f6886' },
  { light: '#9c755f', dark: '#7f6352' },
  { light: '#ff9da7', dark: '#c9808a' },
];

const SessionsIcon = () => (
  <span className="h-0.5 w-3 shrink-0 rounded-full bg-[--color-sessions]" />
);

interface ApplicationEventsChartProps {
  data?: Pick<
    AppRouterOutput['application']['eventStats'],
    'current' | 'eventBreakdown'
  >;
  unit: DateUnit;
}

export const ApplicationEventsChart: React.FC<ApplicationEventsChartProps> = ({
  data,
  unit,
}) => {
  const { t } = useTranslation();
  const { chartData, chartConfig, eventKeys } = useMemo(() => {
    const totals = new Map<string | null, number>();
    for (const item of data?.eventBreakdown ?? []) {
      totals.set(
        item.eventName,
        (totals.get(item.eventName) ?? 0) + item.eventCount
      );
    }
    const eventNames = [...totals.keys()].sort((a, b) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return totals.get(b)! - totals.get(a)! || a.localeCompare(b);
    });
    // Event names can contain paths or reserved keys used by Recharts.
    const keys = new Map(
      eventNames.map((name, index) => [name, `event_${index}`])
    );
    const chartConfig: ChartConfig = {};
    for (const [name, key] of keys) {
      chartConfig[key] = {
        label: name ?? t('Other'),
        theme:
          name === null
            ? { light: '#d4d4d8', dark: '#3f3f46' }
            : EVENT_COLORS[eventNames.indexOf(name)],
      };
    }
    chartConfig.sessions = {
      label: t('Sessions'),
      icon: SessionsIcon,
      theme: { light: '#2680eb', dark: '#5a9df2' },
    };

    const buckets = new Map(
      (data?.current ?? []).map((item) => [
        item.date,
        {
          ...Object.fromEntries([...keys.values()].map((key) => [key, 0])),
          date: item.date,
          sessions: item.sessionCount,
        } as Record<string, string | number>,
      ])
    );
    for (const item of data?.eventBreakdown ?? []) {
      const bucket = buckets.get(item.date);
      const key = keys.get(item.eventName);
      if (bucket && key) {
        bucket[key] = item.eventCount;
      }
    }
    return {
      chartData: [...buckets.values()],
      chartConfig,
      eventKeys: [...keys.values()],
    };
  }, [data, t]);

  return (
    <div>
      <div className="text-muted-foreground mb-2 flex justify-between text-xs">
        <span>{t('Events')}</span>
        <span>{t('Sessions')}</span>
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
        <ComposedChart
          data={chartData}
          accessibilityLayer
          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatDateWithUnit(value, unit)}
            minTickGap={30}
          />
          <YAxis
            yAxisId="events"
            allowDecimals={false}
            width={40}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="sessions"
            orientation="right"
            allowDecimals={false}
            width={40}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) =>
                  formatDateWithUnit(payload[0].payload.date, unit)
                }
              />
            }
          />
          <ChartLegend
            content={<ChartLegendContent className="flex-wrap gap-y-2" />}
          />
          {eventKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              yAxisId="events"
              stackId="events"
              fill={`var(--color-${key})`}
              maxBarSize={40}
              isAnimationActive={false}
            />
          ))}
          <Line
            dataKey="sessions"
            yAxisId="sessions"
            type="monotone"
            stroke="var(--color-sessions)"
            strokeWidth={2}
            dot={chartData.length === 1 && { fill: 'var(--color-sessions)' }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
};
