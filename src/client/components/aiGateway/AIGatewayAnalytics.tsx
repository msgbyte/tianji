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
import { InsightQueryChart } from '../insights/InsightQueryChart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface AIGatewayAnalyticsProps {
  gatewayId: string;
}

type UsageMetric = '$all_event' | 'inputToken' | 'outputToken' | 'price';

export const AIGatewayAnalytics: React.FC<AIGatewayAnalyticsProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const { gatewayId } = props;
    const workspaceId = useCurrentWorkspaceId();
    const { startDate, endDate, unit } = useGlobalRangeDate();

    const [usageMetric, setUsageMetric] = useState<UsageMetric>('$all_event');

    const trpcUtils = trpc.useUtils();
    const handleRefresh = useEvent(async () => {
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

    const valueProcessor = useEvent((value: number) => {
      return Math.max(value, 0);
    });

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
            <TabsTrigger value="models">{t('Models')}</TabsTrigger>
            <TabsTrigger value="errors">{t('Errors')}</TabsTrigger>
          </TabsList>

          {/* Performance Analytics */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                    valueProcessor={valueProcessor}
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
                  />
                </CardContent>
              </Card>
            </div>
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
                  />
                </CardContent>
              </Card>
            </div>

            {/* Success Rate Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>{t('Successful Requests Trend')}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t('Number of events with Success status over time')}
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
                      value: 'Success',
                    },
                  ]}
                  groups={[]}
                  time={timeConfig}
                  chartType="area"
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
