import React, { useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/api/trpc';
import { TimeEventChart } from '@/components/chart/TimeEventChart';
import type { ChartConfig } from '@/components/ui/chart';
import dayjs from 'dayjs';
import { getDateArray } from '@tianji/shared';

const countChartConfig: ChartConfig = {
  successCount: {
    label: 'Success',
    color: 'hsl(var(--chart-2))',
  },
  failedCount: {
    label: 'Failed',
    color: 'hsl(var(--chart-5))',
  },
};

const durationChartConfig: ChartConfig = {
  avgDuration: {
    label: 'Avg',
    color: 'hsl(var(--chart-1))',
  },
  p75Duration: {
    label: 'P75',
    color: 'hsl(var(--chart-2))',
  },
  p90Duration: {
    label: 'P90',
    color: 'hsl(var(--chart-4))',
  },
  p99Duration: {
    label: 'P99',
    color: 'hsl(var(--chart-5))',
  },
};

const memoryChartConfig: ChartConfig = {
  avgMemoryUsed: {
    label: 'Avg',
    color: 'hsl(var(--chart-3))',
  },
  p75MemoryUsed: {
    label: 'P75',
    color: 'hsl(var(--chart-2))',
  },
  p90MemoryUsed: {
    label: 'P90',
    color: 'hsl(var(--chart-4))',
  },
  p99MemoryUsed: {
    label: 'P99',
    color: 'hsl(var(--chart-5))',
  },
};

const cpuChartConfig: ChartConfig = {
  avgCpuTime: {
    label: 'Avg',
    color: 'hsl(var(--chart-4))',
  },
  p75CpuTime: {
    label: 'P75',
    color: 'hsl(var(--chart-2))',
  },
  p90CpuTime: {
    label: 'P90',
    color: 'hsl(var(--chart-1))',
  },
  p99CpuTime: {
    label: 'P99',
    color: 'hsl(var(--chart-5))',
  },
};

export const WorkerHourlyCharts: React.FC<{
  workspaceId: string;
  workerId: string;
}> = React.memo(({ workspaceId, workerId }) => {
  const { t } = useTranslation();

  const startDate = dayjs().subtract(24, 'hour').startOf('hour');
  const endDate = dayjs().endOf('hour');

  const { data: hourlyStats } = trpc.worker.getExecutionHourlyStats.useQuery(
    { workspaceId, workerId },
    {
      trpc: {
        context: { skipBatch: true },
      },
      refetchInterval: 5 * 60 * 1000,
    }
  );

  const countData = useMemo(() => {
    if (!hourlyStats || hourlyStats.length === 0) return [];
    return getDateArray(
      hourlyStats.map((item) => ({
        date: item.date,
        successCount: item.successCount,
        failedCount: item.failedCount,
      })),
      startDate,
      endDate,
      'hour'
    );
  }, [hourlyStats, startDate.valueOf(), endDate.valueOf()]);

  const durationData = useMemo(() => {
    if (!hourlyStats || hourlyStats.length === 0) return [];
    return getDateArray(
      hourlyStats.map((item) => ({
        date: item.date,
        avgDuration: item.avgDuration,
        p75Duration: item.p75Duration,
        p90Duration: item.p90Duration,
        p99Duration: item.p99Duration,
      })),
      startDate,
      endDate,
      'hour'
    );
  }, [hourlyStats, startDate.valueOf(), endDate.valueOf()]);

  const memoryData = useMemo(() => {
    if (!hourlyStats || hourlyStats.length === 0) return [];
    return getDateArray(
      hourlyStats.map((item) => ({
        date: item.date,
        avgMemoryUsed: Math.round(item.avgMemoryUsed / 1024),
        p75MemoryUsed: Math.round(item.p75MemoryUsed / 1024),
        p90MemoryUsed: Math.round(item.p90MemoryUsed / 1024),
        p99MemoryUsed: Math.round(item.p99MemoryUsed / 1024),
      })),
      startDate,
      endDate,
      'hour'
    );
  }, [hourlyStats, startDate.valueOf(), endDate.valueOf()]);

  const cpuData = useMemo(() => {
    if (!hourlyStats || hourlyStats.length === 0) return [];
    return getDateArray(
      hourlyStats.map((item) => ({
        date: item.date,
        avgCpuTime: Math.round(item.avgCpuTime / 1000),
        p75CpuTime: Math.round(item.p75CpuTime / 1000),
        p90CpuTime: Math.round(item.p90CpuTime / 1000),
        p99CpuTime: Math.round(item.p99CpuTime / 1000),
      })),
      startDate,
      endDate,
      'hour'
    );
  }, [hourlyStats, startDate.valueOf(), endDate.valueOf()]);

  if (!hourlyStats || hourlyStats.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center">
          <span className="text-muted-foreground text-sm">
            {t('No execution data in the last 24 hours')}
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {t('Executions (24h)')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEventChart
            className="w-full"
            data={countData}
            unit="hour"
            chartType="bar"
            chartConfig={countChartConfig}
            hideLegend={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {t('Duration (24h)')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEventChart
            className="w-full"
            data={durationData}
            unit="hour"
            chartType="line"
            chartConfig={durationChartConfig}
            hideLegend={false}
            valueFormatter={(v) => `${v}ms`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {t('Memory Usage (24h)')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEventChart
            className="w-full"
            data={memoryData}
            unit="hour"
            chartType="line"
            chartConfig={memoryChartConfig}
            hideLegend={false}
            valueFormatter={(v) => `${v}KB`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {t('CPU Time (24h)')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEventChart
            className="w-full"
            data={cpuData}
            unit="hour"
            chartType="line"
            chartConfig={cpuChartConfig}
            hideLegend={false}
            valueFormatter={(v) => `${v}μs`}
          />
        </CardContent>
      </Card>
    </div>
  );
});
WorkerHourlyCharts.displayName = 'WorkerHourlyCharts';
