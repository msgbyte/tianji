import React, { useMemo } from 'react';
import { TimeEventChart } from '../chart/TimeEventChart';
import { ChartConfig } from '../ui/chart';
import { useTranslation } from '@i18next-toolkit/react';
import { useGlobalRangeDate } from '../../hooks/useGlobalRangeDate';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DateFilter } from '../DateFilter';
import { Button } from '../ui/button';
import { LuRefreshCw } from 'react-icons/lu';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { StatCard } from './StatCard';
import prettyMilliseconds from 'pretty-ms';

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
          color: 'hsl(var(--chart-2))',
        },
      };
    }, [t]);

    // Calculate totals and differences for the statistics cards
    const statsData = useMemo(() => {
      if (!data) {
        return {
          events: { total: 0, diff: 0 },
          sessions: { total: 0, diff: 0 },
          avgTime: { total: 0, diff: 0 },
          avgEventsPerSession: { total: 0, diff: 0 },
          avgScreensPerSession: { total: 0, diff: 0 },
        };
      }

      // Calculate current period totals
      const currentTotals = data.current.reduce(
        (acc, item) => {
          acc.events += item.eventCount;
          acc.sessions += item.sessionCount;
          acc.avgTime +=
            item.sessionCount > 0 ? item.totalTime / item.sessionCount : 0;
          acc.avgEventsPerSession += item.avgEventsPerSession;
          acc.avgScreensPerSession += item.avgScreensPerSession;
          return acc;
        },
        {
          events: 0,
          sessions: 0,
          avgTime: 0,
          avgEventsPerSession: 0,
          avgScreensPerSession: 0,
        }
      );

      // Calculate previous period totals
      const previousTotals = data.previous.reduce(
        (acc, item) => {
          acc.events += item.eventCount;
          acc.sessions += item.sessionCount;
          acc.avgTime +=
            item.sessionCount > 0 ? item.totalTime / item.sessionCount : 0;
          acc.avgEventsPerSession += item.avgEventsPerSession;
          acc.avgScreensPerSession += item.avgScreensPerSession;
          return acc;
        },
        {
          events: 0,
          sessions: 0,
          avgTime: 0,
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
        avgTime: {
          total: currentTotals.avgTime,
          diff: currentTotals.avgTime - previousTotals.avgTime,
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

        <div className="flex flex-wrap">
          <StatCard
            label={t('Events')}
            curr={statsData.events.total}
            diff={statsData.events.diff}
          />

          <StatCard
            label={t('Sessions')}
            curr={statsData.sessions.total}
            diff={statsData.sessions.diff}
          />

          <StatCard
            label={t('Avg. Time')}
            curr={statsData.avgTime.total}
            diff={statsData.avgTime.diff}
            formatter={(value) => prettyMilliseconds(value)}
          />

          <StatCard
            label={t('Avg. Events / Session')}
            curr={statsData.avgEventsPerSession.total}
            diff={statsData.avgEventsPerSession.diff}
          />

          <StatCard
            label={t('Avg. Screens / Session')}
            curr={statsData.avgScreensPerSession.total}
            diff={statsData.avgScreensPerSession.diff}
            borderRight={false}
          />
        </div>
      </Card>
    );
  });

ApplicationStatsChart.displayName = 'ApplicationStatsChart';
