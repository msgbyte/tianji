import { useMemo } from 'react';
import { get, groupBy, merge, omit, values } from 'lodash-es';
import { DateUnit, GroupInfo, getDateArray } from '@tianji/shared';
import { pickColorWithNum } from '@/utils/color';
import { ChartConfig } from '@/components/ui/chart';

export interface InsightsRawData {
  name: string;
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
 * Handles both simple and grouped data scenarios
 */
export function processInsightsData(options: UseInsightsDataOptions): {
  chartData: ProcessedChartData[];
  chartConfig: ChartConfig;
  simpleData: Array<{ date: string; value: number }>;
} {
  const { data, groups, time, valueProcessor } = options;

  if (!data || data.length === 0) {
    return {
      chartData: [],
      chartConfig: {},
      simpleData: [],
    };
  }

  // For simple case (no groups or single metric), return simple data format
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
          label: data[0].name,
          color: pickColorWithNum(0),
        },
      },
      simpleData,
    };
  }

  // For complex case (groups or multiple metrics), process full chart data
  const res: { date: string }[] = [];
  const dates = data[0].data.map((item) => item.date);

  dates.forEach((date) => {
    data.forEach((item) => {
      const value = item.data.find((d) => d.date === date)?.value ?? 0;
      const processedValue = valueProcessor?.(value) ?? value;
      let name = item.name;

      // Add group suffixes to name if groups exist
      if (groups.length > 0) {
        name +=
          '-' +
          groups
            .map((group) => {
              return get(item, group.value);
            })
            .join('-');
      }

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
  const simpleData = getDateArray(
    data[0]?.data.map((item) => ({
      date: item.date,
      value: valueProcessor?.(item.value) ?? item.value,
    })) || [],
    time.startAt,
    time.endAt,
    time.unit
  );

  return {
    chartData,
    chartConfig,
    simpleData,
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
