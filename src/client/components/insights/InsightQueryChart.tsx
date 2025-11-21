import { trpc } from '@/api/trpc';
import React from 'react';
import { LoadingView } from '../LoadingView';
import {
  TimeEventChart,
  TimeEventChartType,
  useTimeEventChartConfig,
} from '../chart/TimeEventChart';
import { InsightType } from '@/store/insights';
import { DateUnit, FilterInfo, GroupInfo, MetricsInfo } from '@tianji/shared';
import { getUserTimezone } from '@/api/model/user';
import { ChartConfig } from '../ui/chart';
import { InsightsRawData, useInsightsData } from '@/hooks/useInsightsData';

interface InsightQueryChartProps {
  className?: string;
  containerClassName?: string;

  workspaceId: string;
  insightId: string;
  insightType: InsightType;
  metrics: MetricsInfo[];
  filters: FilterInfo[];
  groups: GroupInfo[];
  time: {
    startAt: number;
    endAt: number;
    unit: DateUnit;
    timezone?: string;
  };

  chartType: TimeEventChartType;
  chartConfig?: ChartConfig;

  valueProcessor?: (value: number) => number;
}
export const InsightQueryChart: React.FC<InsightQueryChartProps> = React.memo(
  (props) => {
    const {
      className,
      containerClassName,
      workspaceId,
      insightId,
      insightType,
      metrics,
      filters,
      groups,
      time,
      chartType,
      chartConfig,
      valueProcessor,
    } = props;

    const { data: rawData = [], isLoading } = trpc.insights.query.useQuery(
      {
        workspaceId,
        insightId,
        insightType,
        metrics,
        filters,
        groups,
        time: {
          timezone: getUserTimezone(),
          ...time,
        },
      },
      {
        trpc: {
          context: {
            skipBatch: true,
          },
        },
      }
    );

    const {
      chartData,
      chartConfig: processedChartConfig,
      simpleData,
      isMultiSeries,
    } = useInsightsData({
      data: rawData as InsightsRawData[],
      groups,
      time,
      valueProcessor,
    });

    // Use simple data for backward compatibility when it's a single series
    const data = !isMultiSeries ? simpleData : chartData;
    const defaultChartConfig = useTimeEventChartConfig(data);

    return (
      <LoadingView className={containerClassName} isLoading={isLoading}>
        <TimeEventChart
          key={data.length}
          className={className}
          data={data}
          unit={time.unit}
          chartConfig={
            chartConfig ?? processedChartConfig ?? defaultChartConfig
          }
          chartType={chartType}
        />
      </LoadingView>
    );
  }
);
InsightQueryChart.displayName = 'InsightQueryChart';

export const defaultValueProcessor: Record<string, (value: number) => number> =
  {
    alwaysPositive: (value: number) => Math.max(value, 0),
  };
