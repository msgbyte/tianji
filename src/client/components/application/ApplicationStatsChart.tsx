import React, { useMemo } from 'react';
import { TimeEventChart } from '../chart/TimeEventChart';
import { ChartConfig } from '../ui/chart';
import { useTranslation } from '@i18next-toolkit/react';
import { useGlobalRangeDate } from '../../hooks/useGlobalRangeDate';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DateFilter } from '../DateFilter';
import { Button } from '../ui/button';
import { LuRefreshCw, LuArrowUp, LuArrowDown } from 'react-icons/lu';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';

interface ApplicationStatsChartProps {
  applicationId: string;
}

export const ApplicationStatsChart: React.FC<ApplicationStatsChartProps> =
  React.memo((props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { applicationId } = props;
    const { t } = useTranslation();
    const { startDate, endDate, unit, refresh } = useGlobalRangeDate();

    const { data } = trpc.application.eventStats.useQuery({
      workspaceId,
      applicationId,
      startAt: startDate.valueOf(),
      endAt: endDate.valueOf(),
      unit,
    });

    // Use real data from the API instead of mock data
    const chartData = useMemo(() => {
      if (!data) {
        return [];
      }

      // For combined view, show event counts and unique event counts
      return data.current.map((item) => ({
        date: item.date,
        events: item.eventCount,
        sessions: item.sessionCount,
        avgEventsPerSession: item.avgEventsPerSession,
        avgScreensPerSession: item.avgScreensPerSession,
      }));
    }, [data]);

    // Define chart configuration
    const chartConfig = useMemo<ChartConfig>(() => {
      return {
        events: {
          label: t('Events'),
          color: 'hsl(var(--chart-1))',
        },
        sessions: {
          label: t('Sessions'),
          color: 'hsl(var(--chart-3))',
        },
        avgEventsPerSession: {
          label: t('Unique Events'),
          color: 'hsl(var(--chart-2))',
        },
        avgScreensPerSession: {
          label: t('Unique Screens'),
          color: 'hsl(var(--chart-4))',
        },
      };
    }, [t]);

    // Calculate totals and differences for the statistics cards
    const statsData = useMemo(() => {
      if (!data) {
        return {
          events: { total: 0, diff: 0 },
          sessions: { total: 0, diff: 0 },
          avgEventsPerSession: { total: 0, diff: 0 },
          avgScreensPerSession: { total: 0, diff: 0 },
        };
      }

      // Calculate current period totals
      const currentTotals = data.current.reduce(
        (acc, item) => {
          acc.events += item.eventCount;
          acc.sessions += item.sessionCount;
          acc.avgEventsPerSession += item.avgEventsPerSession;
          acc.avgScreensPerSession += item.avgScreensPerSession;
          return acc;
        },
        {
          events: 0,
          sessions: 0,
          avgEventsPerSession: 0,
          avgScreensPerSession: 0,
        }
      );

      // Calculate previous period totals
      const previousTotals = data.previous.reduce(
        (acc, item) => {
          acc.events += item.eventCount;
          acc.sessions += item.sessionCount;
          acc.avgEventsPerSession += item.avgEventsPerSession;
          acc.avgScreensPerSession += item.avgScreensPerSession;
          return acc;
        },
        {
          events: 0,
          sessions: 0,
          avgEventsPerSession: 0,
          avgScreensPerSession: 0,
        }
      );

      // Calculate differences
      return {
        events: {
          total: currentTotals.events,
          diff: currentTotals.events - previousTotals.events,
        },
        sessions: {
          total: currentTotals.sessions,
          diff: currentTotals.sessions - previousTotals.sessions,
        },
        avgEventsPerSession: {
          total: currentTotals.avgEventsPerSession,
          diff:
            currentTotals.avgEventsPerSession -
            previousTotals.avgEventsPerSession,
        },
        avgScreensPerSession: {
          total: currentTotals.avgScreensPerSession,
          diff:
            currentTotals.avgScreensPerSession -
            previousTotals.avgScreensPerSession,
        },
      };
    }, [data]);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('Application Statistics')}</span>
            <div className="flex items-center space-x-2">
              <DateFilter />
              <Button
                size="icon"
                variant="outline"
                onClick={refresh}
                title={t('Refresh')}
              >
                <LuRefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEventChart
            data={chartData}
            unit={unit}
            chartConfig={chartConfig}
          />
        </CardContent>

        <div className="grid grid-cols-2 border-t md:grid-cols-4">
          <div className="border-border border-r p-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                {t('Events')}
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {statsData.events.total.toLocaleString()}
                </span>
                {statsData.events.diff !== 0 && (
                  <div
                    className={`flex items-center ${statsData.events.diff > 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {statsData.events.diff > 0 ? (
                      <LuArrowUp className="mr-1" />
                    ) : (
                      <LuArrowDown className="mr-1" />
                    )}
                    <span>
                      {Math.abs(statsData.events.diff).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-border border-r p-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                {t('Sessions')}
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {statsData.sessions.total.toLocaleString()}
                </span>
                {statsData.sessions.diff !== 0 && (
                  <div
                    className={`flex items-center ${statsData.sessions.diff > 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {statsData.sessions.diff > 0 ? (
                      <LuArrowUp className="mr-1" />
                    ) : (
                      <LuArrowDown className="mr-1" />
                    )}
                    <span>
                      {Math.abs(statsData.sessions.diff).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-border border-r p-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                {t('Avg Events / Session')}
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {statsData.avgEventsPerSession.total.toLocaleString()}
                </span>
                {statsData.avgEventsPerSession.diff !== 0 && (
                  <div
                    className={`flex items-center ${statsData.avgEventsPerSession.diff > 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {statsData.avgEventsPerSession.diff > 0 ? (
                      <LuArrowUp className="mr-1" />
                    ) : (
                      <LuArrowDown className="mr-1" />
                    )}
                    <span>
                      {Math.abs(
                        statsData.avgEventsPerSession.diff
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-border p-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                {t('Avg Screens / Session')}
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {statsData.avgScreensPerSession.total.toLocaleString()}
                </span>
                {statsData.avgScreensPerSession.diff !== 0 && (
                  <div
                    className={`flex items-center ${statsData.avgScreensPerSession.diff > 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {statsData.avgScreensPerSession.diff > 0 ? (
                      <LuArrowUp className="mr-1" />
                    ) : (
                      <LuArrowDown className="mr-1" />
                    )}
                    <span>
                      {Math.abs(
                        statsData.avgScreensPerSession.diff
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  });

ApplicationStatsChart.displayName = 'ApplicationStatsChart';
