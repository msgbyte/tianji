import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/api/trpc';
import { LuActivity } from 'react-icons/lu';
import { WorkerHourlyCharts } from './WorkerHourlyCharts';

export const WorkerStatsSection: React.FC<{
  workspaceId: string;
  workerId: string;
  enableCron?: boolean;
  cronExpression?: string | null;
  active?: boolean;
}> = React.memo(
  ({ workspaceId, workerId, enableCron, cronExpression, active }) => {
    const { t } = useTranslation();

    const { data: stats } = trpc.worker.getExecutionStats.useQuery(
      {
        workspaceId,
        workerId,
        days: 7,
      },
      {
        trpc: {
          context: {
            skipBatch: true,
          },
        },
      }
    );

    return (
      <div className="space-y-4">
        {enableCron && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LuActivity className="h-5 w-5" />
                <span>{t('Cron Schedule')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-muted-foreground text-sm font-medium">
                    {t('Expression')}
                  </div>
                  <div className="font-mono text-sm">{cronExpression}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm font-medium">
                    {t('Status')}
                  </div>
                  <div className="text-sm">
                    {active
                      ? t('Running')
                      : t('Stopped (Worker Inactive)')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('Total Executions')}
                </CardTitle>
                <LuActivity className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalExecutions}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('Success Rate')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalExecutions > 0
                    ? `${Math.round((stats.successExecutions / stats.totalExecutions) * 100)}%`
                    : '0%'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('Avg Duration')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgDuration
                    ? `${Math.round(stats.avgDuration)}ms`
                    : '-'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('Avg Memory Usage')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgMemoryUsed
                    ? `${Math.round(stats.avgMemoryUsed / 1024)}KB`
                    : '-'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('Avg CPU Time')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgCpuTime
                    ? `${Math.round(stats.avgCpuTime / 1000)}μs`
                    : '-'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <WorkerHourlyCharts workspaceId={workspaceId} workerId={workerId} />
      </div>
    );
  }
);
WorkerStatsSection.displayName = 'WorkerStatsSection';

export default WorkerStatsSection;
