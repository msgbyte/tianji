import React from 'react';
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
    const chartData = React.useMemo(() => {
      if (!data) {
        return [];
      }

      // For combined view, show event counts and unique event counts
      return data.current.map((item) => ({
        date: item.date,
        events: item.eventCount,
        uniqueEvents: item.uniqueEventCount,
        sessions: item.sessionCount,
        uniqueScreens: item.uniqueScreenCount,
      }));
    }, [data]);

    // Define chart configuration
    const chartConfig = React.useMemo<ChartConfig>(() => {
      return {
        events: {
          label: t('Events'),
          color: 'hsl(var(--chart-1))',
        },
        uniqueEvents: {
          label: t('Unique Events'),
          color: 'hsl(var(--chart-2))',
        },
        sessions: {
          label: t('Sessions'),
          color: 'hsl(var(--chart-3))',
        },
        uniqueScreens: {
          label: t('Unique Screens'),
          color: 'hsl(var(--chart-4))',
        },
      };
    }, []);

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
      </Card>
    );
  });

ApplicationStatsChart.displayName = 'ApplicationStatsChart';
