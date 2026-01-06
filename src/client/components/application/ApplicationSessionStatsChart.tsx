import React, { useMemo } from 'react';
import { SimplePieChart } from '../chart/SimplePieChart';
import { trpc, AppRouterInput } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { ChartConfig } from '../ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useTranslation } from '@i18next-toolkit/react';
import { useGlobalRangeDate } from '@/hooks/useGlobalRangeDate';
import { Loading } from '../Loading';

const MAX_DISPLAY_ITEMS = 5;
const OTHER_NAME = 'Other';

type SessionStatsGroupBy =
  AppRouterInput['application']['sessionStats']['groupBy'];

interface ApplicationSessionStatsChartProps {
  applicationId: string;
  groupBy: SessionStatsGroupBy;
  title: string;
  formatLabel?: (name: string) => string;
}

export const ApplicationSessionStatsChart: React.FC<ApplicationSessionStatsChartProps> =
  React.memo((props) => {
    const { applicationId, groupBy, title, formatLabel } = props;
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();
    const { startDate, endDate } = useGlobalRangeDate();

    const { data: stats = [], isLoading } =
      trpc.application.sessionStats.useQuery({
        workspaceId,
        applicationId,
        startAt: startDate.valueOf(),
        endAt: endDate.valueOf(),
        groupBy,
      });

    const { data, chartConfig } = useMemo(() => {
      if (stats.length === 0) {
        return { data: [], chartConfig: {} };
      }

      const topItems = stats.slice(0, MAX_DISPLAY_ITEMS);
      const otherItems = stats.slice(MAX_DISPLAY_ITEMS);

      const displayData = [...topItems];

      if (otherItems.length > 0) {
        const otherCount = otherItems.reduce(
          (acc, item) => acc + item.count,
          0
        );
        displayData.push({
          name: OTHER_NAME,
          count: otherCount,
        });
      }

      const getLabel = (name: string) => {
        if (name === OTHER_NAME || name === 'Unknown') {
          return name;
        }
        return formatLabel ? formatLabel(name) : name;
      };

      const chartConfig: ChartConfig = {};
      displayData.forEach((item, i) => {
        chartConfig[`item-${i}`] = {
          label: getLabel(item.name),
          color: `hsl(var(--chart-${(i % 5) + 1}))`,
        };
      });

      return {
        data: displayData.map((item, i) => ({
          label: getLabel(item.name),
          count: item.count,
          fill: `var(--color-item-${i})`,
        })),
        chartConfig,
      };
    }, [stats, formatLabel]);

    if (isLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Loading />
          </CardContent>
        </Card>
      );
    }

    if (data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex h-[200px] items-center justify-center">
              {t('No Data')}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <SimplePieChart
            className="mx-auto max-h-[240px]"
            data={data}
            chartConfig={chartConfig}
          />
        </CardContent>
      </Card>
    );
  });

ApplicationSessionStatsChart.displayName = 'ApplicationSessionStatsChart';
