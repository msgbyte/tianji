import React, { useMemo } from 'react';
import {
  TimeEventChart,
  TimeEventChartProps,
  useTimeEventChartConfig,
} from '../chart/TimeEventChart';
import {
  GroupedTimeSeriesQuery,
  processGroupedTimeSeriesData,
} from '@tianji/shared';
import { InsightsRawData, useInsightsData } from '@/hooks/useInsightsData';
import { getUserTimezone } from '@/api/model/user';

type RawData = { date: string | null; [key: string]: any };

export interface InsightsTimeEventChartProps
  extends Pick<
      TimeEventChartProps,
      | 'chartConfig'
      | 'chartType'
      | 'yAxisDomain'
      | 'drawDashLine'
      | 'drawGradientArea'
      | 'isTrendingMode'
      | 'showDifference'
      | 'hideLegend'
      | 'valueFormatter'
      | 'xAxisLabelFormatter'
      | 'tooltipLabelFormatter'
    >,
    GroupedTimeSeriesQuery {
  className?: string;
  rawData: RawData[];
  valueProcessor?: (value: number) => number;
}

export const InsightsTimeEventChart: React.FC<InsightsTimeEventChartProps> =
  React.memo((props) => {
    const {
      className,
      rawData,
      metrics = [],
      groups = [],
      time,
      valueProcessor,
      chartConfig,
      chartType = 'area',
      yAxisDomain,
      drawGradientArea,
      drawDashLine,
      isTrendingMode,
      showDifference,
      hideLegend,
      valueFormatter,
      xAxisLabelFormatter,
      tooltipLabelFormatter,
    } = props;

    // Process raw database query results if provided
    const processedData = useMemo(() => {
      // Transform rawData to add % prefix to group fields
      // processGroupedTimeSeriesData expects group fields with % prefix
      const transformedData = rawData.map((item) => {
        const newItem = { ...item };
        if (groups) {
          groups.forEach((g) => {
            if (item[g.value] !== undefined) {
              newItem[`%${g.value}`] = item[g.value];
            }
          });
        }
        return newItem;
      });

      return processGroupedTimeSeriesData(
        {
          time: {
            startAt: time.startAt,
            endAt: time.endAt,
            unit: time.unit,
            timezone: time.timezone,
          },
          metrics: metrics.map((m) => ({
            name: m.name,
            alias: m.alias,
          })),
          groups: groups?.map((g) => ({
            value: g.value,
          })),
        },
        { timezone: time.timezone ?? getUserTimezone() },
        transformedData
      ) as InsightsRawData[];
    }, [rawData, metrics, groups, time]);

    const {
      chartData,
      chartConfig: processedChartConfig,
      simpleData,
      isMultiSeries,
    } = useInsightsData({
      data: processedData,
      groups,
      time,
      valueProcessor,
    });

    // Use simple data for backward compatibility when it's a single series
    const data = !isMultiSeries ? simpleData : chartData;
    const defaultChartConfig = useTimeEventChartConfig(data);

    return (
      <TimeEventChart
        key={data.length}
        className={className}
        data={data}
        unit={time.unit}
        chartConfig={chartConfig ?? processedChartConfig ?? defaultChartConfig}
        chartType={chartType}
        yAxisDomain={yAxisDomain}
        drawGradientArea={drawGradientArea}
        drawDashLine={drawDashLine}
        isTrendingMode={isTrendingMode}
        showDifference={showDifference}
        hideLegend={hideLegend}
        valueFormatter={valueFormatter}
        xAxisLabelFormatter={xAxisLabelFormatter}
        tooltipLabelFormatter={tooltipLabelFormatter}
      />
    );
  });
InsightsTimeEventChart.displayName = 'InsightsTimeEventChart';
