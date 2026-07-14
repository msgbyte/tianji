import React, { useState, useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { useCurrentWorkspaceId } from '@/store/user';
import { useGlobalRangeDate } from '@/hooks/useGlobalRangeDate';
import { getUserTimezone } from '@/api/model/user';
import { DateFilter } from '../DateFilter';
import { Button } from '../ui/button';
import { LuRefreshCw } from 'react-icons/lu';
import { useEvent } from '@/hooks/useEvent';
import { trpc } from '@/api/trpc';
import {
  defaultValueProcessor,
  InsightQueryChart,
} from '../insights/InsightQueryChart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TimeEventChart } from '../chart/TimeEventChart';
import { LoadingView } from '../LoadingView';
import { DateUnit, getDateArray } from '@tianji/shared';
import type { InsightsRawData } from '@/hooks/useInsightsData';
import type { ChartConfig } from '../ui/chart';
import { createAIGatewayUserLabelFormatter } from './AIGatewayUserLabel';

// Status color tokens used in the Errors tab.
// Keep the success/failure colors aligned with the rest of the app
// (see AIGatewayStatus: bg-green-* for Success, bg-red-* for Failed).
const STATUS_SUCCESS_COLOR = '#22c55e';
const STATUS_FAILED_COLOR = '#ef4444';

interface AIGatewayAnalyticsProps {
  gatewayId: string;
}

type UsageMetric = '$all_event' | 'inputToken' | 'outputToken' | 'price';

export const AIGatewayAnalytics: React.FC<AIGatewayAnalyticsProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const { gatewayId } = props;
    const workspaceId = useCurrentWorkspaceId();
    const { startDate, endDate, unit, refresh } = useGlobalRangeDate();
    const { data: workspaceMembers = [] } = trpc.workspace.members.useQuery({
      workspaceId,
    });
    const userLabelFormatter = useMemo(
      () => createAIGatewayUserLabelFormatter(workspaceMembers),
      [workspaceMembers]
    );

    const trpcUtils = trpc.useUtils();
    const handleRefresh = useEvent(async () => {
      refresh();
      trpcUtils.insights.query.reset({
        workspaceId,
        insightId: gatewayId,
        insightType: 'aigateway',
      } as any);
    });

    const timeConfig = useMemo(
      () => ({
        startAt: startDate.valueOf(),
        endAt: endDate.valueOf(),
        unit,
        timezone: getUserTimezone(),
      }),
      [startDate, endDate, unit]
    );

    // Force Success vs Failure colors. Series keys follow the
    // `${alias|name}-${groupValue}` pattern from generateSeriesName.
    const statusChartConfig: ChartConfig = useMemo(
      () => ({
        '$all_event-Success': {
          label: t('Success'),
          color: STATUS_SUCCESS_COLOR,
        },
        '$all_event-Failed': {
          label: t('Failed'),
          color: STATUS_FAILED_COLOR,
        },
      }),
      [t]
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('Usage Analytics')}</h2>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={handleRefresh}
              title={t('Refresh')}
            >
              <LuRefreshCw className="h-4 w-4" />
            </Button>
            <DateFilter />
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList>
            <TabsTrigger value="performance">{t('Performance')}</TabsTrigger>
            <TabsTrigger value="providers">{t('Providers')}</TabsTrigger>
            <TabsTrigger value="models">{t('Models')}</TabsTrigger>
            <TabsTrigger value="users">{t('Users')}</TabsTrigger>
            <TabsTrigger value="errors">{t('Errors')}</TabsTrigger>
          </TabsList>

          {/* Performance Analytics */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Response Time Percentiles')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'Duration percentiles (P50, P90, P99) showing response time distribution over time'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[
                      { name: 'duration', math: 'p50', alias: 'p50' },
                      { name: 'duration', math: 'p90', alias: 'p90' },
                      { name: 'duration', math: 'p99', alias: 'p99' },
                    ]}
                    filters={[]}
                    groups={[]}
                    time={timeConfig}
                    chartType="line"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('First Token Response Time')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'TTFT percentiles (P50, P90, P99) showing time to first token distribution over time'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[
                      { name: 'ttft', math: 'p50', alias: 'p50' },
                      { name: 'ttft', math: 'p90', alias: 'p90' },
                      { name: 'ttft', math: 'p99', alias: 'p99' },
                    ]}
                    filters={[]}
                    groups={[]}
                    time={timeConfig}
                    chartType="line"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('Output Token Latency')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'TPOT percentiles (P50, P90, P99) showing streaming generation latency over time'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[
                      { name: 'tpot', math: 'p50', alias: 'p50' },
                      { name: 'tpot', math: 'p90', alias: 'p90' },
                      { name: 'tpot', math: 'p99', alias: 'p99' },
                    ]}
                    filters={[]}
                    groups={[]}
                    time={timeConfig}
                    chartType="line"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Performance by Model */}
            <Card>
              <CardHeader>
                <CardTitle>{t('Model Performance Comparison')}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t(
                    'Average response time (duration) comparison across different AI models'
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <InsightQueryChart
                  className="h-[400px] w-full"
                  workspaceId={workspaceId}
                  insightId={gatewayId}
                  insightType="aigateway"
                  metrics={[{ name: 'duration', math: 'avg' }]}
                  filters={[]}
                  groups={[{ value: 'modelName', type: 'string' }]}
                  time={timeConfig}
                  chartType="bar"
                  valueProcessor={defaultValueProcessor.alwaysPositive}
                />
              </CardContent>
            </Card>

            {/* Performance Distribution */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Request Volume Over Time')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'Total number of events (all API requests) processed over time'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[{ name: '$all_event', math: 'events' }]}
                    filters={[]}
                    groups={[]}
                    time={timeConfig}
                    chartType="area"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('Response Time by Streaming Mode')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'Average response time (duration) comparison between streaming and non-streaming requests'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[{ name: 'duration', math: 'avg' }]}
                    filters={[]}
                    groups={[{ value: 'stream', type: 'boolean' }]}
                    time={timeConfig}
                    chartType="bar"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Provider Analytics */}
          <TabsContent value="providers" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Request Count by Provider')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'Total request count distribution across different upstream providers (e.g. openai, openrouter, anthropic)'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[{ name: '$all_event', math: 'events' }]}
                    filters={[]}
                    groups={[{ value: 'modelProvider', type: 'string' }]}
                    time={timeConfig}
                    chartType="pie"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('Cost by Provider')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'Total cost distribution across different upstream providers'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[{ name: 'price', math: 'events' }]}
                    filters={[]}
                    groups={[{ value: 'modelProvider', type: 'string' }]}
                    time={timeConfig}
                    chartType="bar"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('Provider Request Trend')}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t(
                    'Request volume over time grouped by upstream providers'
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <InsightQueryChart
                  className="h-[300px] w-full"
                  workspaceId={workspaceId}
                  insightId={gatewayId}
                  insightType="aigateway"
                  metrics={[{ name: '$all_event', math: 'events' }]}
                  filters={[]}
                  groups={[{ value: 'modelProvider', type: 'string' }]}
                  time={timeConfig}
                  chartType="line"
                  valueProcessor={defaultValueProcessor.alwaysPositive}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('Token Usage by Provider')}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t(
                    'Total token consumption (input + output + cache) distribution across different upstream providers'
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <InsightQueryChart
                  className="h-[400px] w-full"
                  workspaceId={workspaceId}
                  insightId={gatewayId}
                  insightType="aigateway"
                  metrics={[
                    { name: 'inputToken', math: 'events', alias: 'inputToken' },
                    {
                      name: 'outputToken',
                      math: 'events',
                      alias: 'outputToken',
                    },
                    {
                      name: 'cacheReadInputToken',
                      math: 'events',
                      alias: 'cacheReadInputToken',
                    },
                    {
                      name: 'cacheWriteInputToken',
                      math: 'events',
                      alias: 'cacheWriteInputToken',
                    },
                  ]}
                  filters={[]}
                  groups={[{ value: 'modelProvider', type: 'string' }]}
                  time={timeConfig}
                  chartType="bar"
                  valueProcessor={defaultValueProcessor.alwaysPositive}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('Average Response Time by Provider')}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t(
                    'Average response time (duration) comparison across different upstream providers'
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <InsightQueryChart
                  className="h-[300px] w-full"
                  workspaceId={workspaceId}
                  insightId={gatewayId}
                  insightType="aigateway"
                  metrics={[{ name: 'duration', math: 'avg' }]}
                  filters={[]}
                  groups={[{ value: 'modelProvider', type: 'string' }]}
                  time={timeConfig}
                  chartType="bar"
                  valueProcessor={defaultValueProcessor.alwaysPositive}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Model Analytics */}
          <TabsContent value="models" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('Model Usage Statistics')}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t(
                    'Total event count (request volume) distribution across different AI models'
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <InsightQueryChart
                  className="h-[400px] w-full"
                  workspaceId={workspaceId}
                  insightId={gatewayId}
                  insightType="aigateway"
                  metrics={[{ name: '$all_event', math: 'events' }]}
                  filters={[]}
                  groups={[{ value: 'modelName', type: 'string' }]}
                  time={timeConfig}
                  chartType="bar"
                  valueProcessor={defaultValueProcessor.alwaysPositive}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Analytics */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Request Count by User')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'Total request count distribution across different users'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[{ name: '$all_event', math: 'events' }]}
                    filters={[]}
                    groups={[{ value: 'userId', type: 'string' }]}
                    time={timeConfig}
                    chartType="bar"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                    groupValueFormatter={userLabelFormatter}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('Cost by User')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'Total cost distribution across different users'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[{ name: 'price', math: 'events' }]}
                    filters={[]}
                    groups={[{ value: 'userId', type: 'string' }]}
                    time={timeConfig}
                    chartType="bar"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                    groupValueFormatter={userLabelFormatter}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('Token Usage by User')}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t(
                    'Total token consumption (input + output + cache input) distribution across different users'
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <InsightQueryChart
                  className="h-[400px] w-full"
                  workspaceId={workspaceId}
                  insightId={gatewayId}
                  insightType="aigateway"
                  metrics={[
                    { name: 'inputToken', math: 'events', alias: 'inputToken' },
                    { name: 'outputToken', math: 'events', alias: 'outputToken' },
                    {
                      name: 'cacheReadInputToken',
                      math: 'events',
                      alias: 'cacheReadInputToken',
                    },
                    {
                      name: 'cacheWriteInputToken',
                      math: 'events',
                      alias: 'cacheWriteInputToken',
                    },
                  ]}
                  filters={[]}
                  groups={[{ value: 'userId', type: 'string' }]}
                  time={timeConfig}
                  chartType="bar"
                  valueProcessor={defaultValueProcessor.alwaysPositive}
                  groupValueFormatter={userLabelFormatter}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Analytics */}
          <TabsContent value="errors" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Success vs Failure Rate')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'Event count distribution grouped by request status (Success/Failed)'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[{ name: '$all_event', math: 'events' }]}
                    filters={[]}
                    groups={[{ value: 'status', type: 'string' }]}
                    time={timeConfig}
                    chartType="pie"
                    chartConfig={statusChartConfig}
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('Failed Requests Trend')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t('Number of events with Failed status over time')}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[{ name: '$all_event', math: 'events' }]}
                    filters={[
                      {
                        name: 'status',
                        type: 'string',
                        operator: 'equals',
                        value: 'Failed',
                      },
                    ]}
                    groups={[]}
                    time={timeConfig}
                    chartType="line"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Error Rate Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>{t('Error Rate Trend')}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t(
                    'Percentage of failed requests out of total requests over time (Failed / Total %)'
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <ErrorRateChart
                  className="h-[300px] w-full"
                  workspaceId={workspaceId}
                  gatewayId={gatewayId}
                  time={timeConfig}
                />
              </CardContent>
            </Card>

            {/* Error Distribution by Model */}
            <Card>
              <CardHeader>
                <CardTitle>{t('Failure Analysis by Model')}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t(
                    'Failed events count breakdown grouped by different AI models'
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <InsightQueryChart
                  className="h-[300px] w-full"
                  workspaceId={workspaceId}
                  insightId={gatewayId}
                  insightType="aigateway"
                  metrics={[{ name: '$all_event', math: 'events' }]}
                  filters={[
                    {
                      name: 'status',
                      type: 'string',
                      operator: 'equals',
                      value: 'Failed',
                    },
                  ]}
                  groups={[{ value: 'modelName', type: 'string' }]}
                  time={timeConfig}
                  chartType="bar"
                  valueProcessor={defaultValueProcessor.alwaysPositive}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);
AIGatewayAnalytics.displayName = 'AIGatewayAnalytics';

interface ErrorRateChartProps {
  workspaceId: string;
  gatewayId: string;
  time: {
    startAt: number;
    endAt: number;
    unit: DateUnit;
    timezone?: string;
  };
  className?: string;
}

const ErrorRateChart: React.FC<ErrorRateChartProps> = React.memo((props) => {
  const { workspaceId, gatewayId, time, className } = props;
  const { t } = useTranslation();

  const { data: rawData = [], isLoading } = trpc.insights.query.useQuery(
    {
      workspaceId,
      insightId: gatewayId,
      insightType: 'aigateway',
      metrics: [{ name: '$all_event', math: 'events' }],
      filters: [],
      groups: [{ value: 'status', type: 'string' }],
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

  const chartData = useMemo(() => {
    const dataArr = rawData as InsightsRawData[];
    // Aggregate success/failed counts per date bucket
    const dateMap = new Map<string, { success: number; failed: number }>();

    dataArr.forEach((item) => {
      const status = (item as any).status;
      item.data.forEach((d) => {
        const entry = dateMap.get(d.date) ?? { success: 0, failed: 0 };
        if (status === 'Success') {
          entry.success += d.value;
        } else if (status === 'Failed') {
          entry.failed += d.value;
        }
        dateMap.set(d.date, entry);
      });
    });

    const arr = Array.from(dateMap.entries()).map(
      ([date, { success, failed }]) => ({ date, success, failed })
    );

    if (arr.length === 0) {
      return [];
    }

    // Fill missing date buckets with success=0/failed=0,
    // then compute rate. Buckets with no traffic at all (total === 0)
    // are emitted as null so the line is left blank instead of pinned to 0.
    return getDateArray(arr, time.startAt, time.endAt, time.unit).map(
      ({ date, success, failed }) => {
        const total = success + failed;
        if (total === 0) {
          return { date, value: null as unknown as number };
        }
        const rate = (failed / total) * 100;
        return { date, value: Math.max(0, Math.min(100, rate)) };
      }
    );
  }, [rawData, time.startAt, time.endAt, time.unit]);

  const chartConfig: ChartConfig = useMemo(
    () => ({
      value: {
        label: t('Error Rate'),
        color: STATUS_FAILED_COLOR,
      },
    }),
    [t]
  );

  return (
    <LoadingView isLoading={isLoading}>
      <TimeEventChart
        className={className}
        data={chartData}
        unit={time.unit}
        chartConfig={chartConfig}
        chartType="area"
        yAxisDomain={[0, 100]}
        valueFormatter={(v) => `${v.toFixed(2)}%`}
      />
    </LoadingView>
  );
});
ErrorRateChart.displayName = 'ErrorRateChart';
