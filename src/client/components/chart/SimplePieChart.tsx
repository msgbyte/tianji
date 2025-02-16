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
  data: { label: string; count: number }[];
  chartConfig: ChartConfig;
  onClick?: (data: PieChartSegment) => void;
}> = React.memo((props) => {
  const { className, data, chartConfig, onClick } = props;
  const { t } = useTranslation();

  const totalCount = React.useMemo(() => {
    return sumBy(data, 'count');
  }, []);

  return (
    <ChartContainer className={className} config={chartConfig}>
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
});
SimplePieChart.displayName = 'SimplePieChart';
