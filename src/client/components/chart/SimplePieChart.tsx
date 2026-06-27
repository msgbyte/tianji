import React from 'react';
import { PieChart, Pie, Label } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';
import { sumBy } from 'lodash-es';
import { useTranslation } from '@i18next-toolkit/react';
import { cn } from '@/utils/style';

type TooltipPayloadItem = {
  name: string;
  value: number;
  payload: {
    payload: {
      label: string;
      count: number;
      fill: string;
    };
    strokeWidth: number;
    stroke: string;
    fill: string;
    cx: string;
    cy: string;
    label: string;
    count: number;
  };
  dataKey: string;
};

type ChartPayload = {
  payload: {
    label: string;
    count: number;
    fill: string;
  };
  strokeWidth: number;
  stroke: string;
  fill: string;
  cx: string;
  cy: string;
  label: string;
  count: number;
};

export type PieChartSegment = {
  percent: number;
  name: string;
  tooltipPayload: TooltipPayloadItem[];
  midAngle: number;
  middleRadius: number;
  tooltipPosition: {
    x: number;
    y: number;
  };
  payload: ChartPayload;
  strokeWidth: number;
  stroke: string;
  fill: string;
  cx: number;
  cy: number;
  label: string;
  count: number;
  innerRadius: number;
  outerRadius: number;
  maxRadius: number;
  value: number;
  startAngle: number;
  endAngle: number;
  paddingAngle: number;
};

export const SimplePieChart: React.FC<{
  className?: string;
  data: { label: string; count: number; fill?: string }[];
  chartConfig: ChartConfig;
  onClick?: (data: PieChartSegment) => void;
  showLegend?: boolean;
}> = React.memo((props) => {
  const { className, data, chartConfig, onClick, showLegend = false } = props;
  const { t } = useTranslation();

  const totalCount = React.useMemo(() => {
    return sumBy(data, 'count');
  }, [data]);

  const displayData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      percent: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
    }));
  }, [data, totalCount]);

  const chart = (
    <ChartContainer
      className={
        showLegend
          ? 'aspect-square h-full min-h-[190px] w-full'
          : className
      }
      config={chartConfig}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={'50%'}
          strokeWidth={5}
          onClick={(d) => {
            onClick?.(d);
          }}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {totalCount.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      {t('Count')}
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );

  if (!showLegend) {
    return chart;
  }

  return (
    <div
      className={cn(
        'grid min-h-[220px] w-full items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.8fr)]',
        className
      )}
    >
      {chart}

      <ul
        aria-label={t('Pie chart segments')}
        className="grid min-w-0 gap-2"
        role="list"
      >
        {displayData.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="border-border/60 bg-muted/20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 rounded-md border px-2.5 py-2"
          >
            <span
              aria-hidden="true"
              className="row-span-2 h-3 w-3 rounded-[3px]"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-foreground min-w-0 truncate text-sm font-medium">
              {item.label}
            </span>
            <span className="text-foreground font-mono text-sm font-semibold tabular-nums">
              {item.count.toLocaleString()}
            </span>
            <span className="text-muted-foreground col-start-2 text-xs">
              {item.percent.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});
SimplePieChart.displayName = 'SimplePieChart';
