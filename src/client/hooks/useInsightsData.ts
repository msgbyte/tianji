import { useMemo } from 'react';
import { get, groupBy, merge, omit, values } from 'lodash-es';
import { DateUnit, GroupInfo, getDateArray } from '@tianji/shared';
import { pickColorWithNum } from '@/utils/color';
import { ChartConfig } from '@/components/ui/chart';

/**
 * Generate display name for a data series
 * @param item - The data item
 * @param groups - The group configurations
 * @returns The display name
 */
function generateSeriesName(
  item: InsightsRawData,
  groups: GroupInfo[]
): string {
  // Use alias if available, otherwise use name
  let name = item.alias ?? item.name;

  if (groups.length > 0) {
    const groupSuffixes = groups
      .map((group) => {
        return get(item, group.value);
      })
      .filter(Boolean) // Remove null/undefined values
      .join('-');

    if (groupSuffixes) {
      name += '-' + groupSuffixes;
    }
  }

  return name;
}

export interface InsightsRawData {
  name: string;
  alias?: string; // Optional alias for the metric
  data: Array<{
    date: string;
    value: number;
  }>;
  [key: string]: any; // For group properties
}

export interface ProcessedChartData {
  date: string;
  [key: string]: string | number;
}

export interface UseInsightsDataOptions {
  data: InsightsRawData[];
  groups: GroupInfo[];
  time: {
    startAt: number;
    endAt: number;
    unit: DateUnit;
  };
  valueProcessor?: (value: number) => number;
}

/**
 * Process insights data for chart rendering
 * Handles various scenarios:
 * - Single metric without groups (simple format)
 * - Multiple metrics without groups (complex format)
 * - Single/Multiple metrics with groups (complex format)
 */
export function processInsightsData(options: UseInsightsDataOptions): {
  chartData: ProcessedChartData[];
  chartConfig: ChartConfig;
  simpleData: Array<{ date: string; value: number }>;
  isMultiSeries: boolean;
  seriesCount: number;
} {
  const { data, groups, time, valueProcessor } = options;

  if (!data || data.length === 0) {
    return {
      chartData: [],
      chartConfig: {},
      simpleData: [],
      isMultiSeries: false,
      seriesCount: 0,
    };
  }

  const isMultiSeries = groups.length > 0 || data.length > 1;
  const seriesCount = data.length;

  // For simple case (no groups and single metric), return simple data format
  if (groups.length === 0 && data.length === 1) {
    const counts = data[0]?.data || [];
    const simpleData = getDateArray(
      counts.map((item) => ({
        date: item.date,
        value: valueProcessor?.(item.value) ?? item.value,
      })),
      time.startAt,
      time.endAt,
      time.unit
    );

    return {
      chartData: simpleData as ProcessedChartData[],
      chartConfig: {
        value: {
          label: data[0].alias ?? data[0].name,
          color: pickColorWithNum(0),
        },
      },
      simpleData,
      isMultiSeries: false,
      seriesCount: 1,
    };
  }

  // For complex case (groups or multiple metrics), process full chart data
  const res: { date: string }[] = [];

  // Collect all unique dates from all data series
  const allDates = new Set<string>();
  data.forEach((item) => {
    item.data.forEach((d) => allDates.add(d.date));
  });
  const dates = Array.from(allDates).sort();

  dates.forEach((date) => {
    data.forEach((item) => {
      const dataPoint = item.data.find((d) => d.date === date);
      const value = dataPoint?.value ?? 0;
      const processedValue = valueProcessor?.(value) ?? value;
      const name = generateSeriesName(item, groups);

      res.push({
        date,
        [name]: processedValue,
      });
    });
  });

  // Merge data by date
  const chartData = values(groupBy(res, 'date')).map((list) =>
    (merge as any)(...list)
  );

  // Generate chart config
  const chartConfig =
    chartData.length > 0
      ? Object.keys(omit(chartData[0], 'date')).reduce((prev, curr, i) => {
          return {
            ...prev,
            [curr]: {
              label: curr,
              color: pickColorWithNum(i),
            },
          };
        }, {})
      : {};

  // Also provide simple data format for backward compatibility
  // For multiple metrics, use the first metric's data
  const firstMetricData = data[0]?.data || [];
  const simpleData = getDateArray(
    firstMetricData.map((item) => ({
      date: item.date,
      value: valueProcessor?.(item.value) ?? item.value,
    })),
    time.startAt,
    time.endAt,
    time.unit
  );

  return {
    chartData,
    chartConfig,
    simpleData,
    isMultiSeries,
    seriesCount,
  };
}

/**
 * Hook for processing insights data with memoization
 */
export function useInsightsData(options: UseInsightsDataOptions) {
  return useMemo(
    () => processInsightsData(options),
    [
      options.data,
      options.groups,
      options.time.startAt,
      options.time.endAt,
      options.time.unit,
      options.valueProcessor,
    ]
  );
}
