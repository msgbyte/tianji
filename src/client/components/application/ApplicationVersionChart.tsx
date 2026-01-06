import React, { useMemo } from 'react';
import { SimplePieChart } from '../chart/SimplePieChart';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { ChartConfig } from '../ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useTranslation } from '@i18next-toolkit/react';
import { useGlobalRangeDate } from '@/hooks/useGlobalRangeDate';
import { Loading } from '../Loading';

const MAX_DISPLAY_VERSIONS = 5;
const OTHER_VERSION_NAME = 'Other';

interface ApplicationVersionChartProps {
  applicationId: string;
}

export const ApplicationVersionChart: React.FC<ApplicationVersionChartProps> =
  React.memo((props) => {
    const { applicationId } = props;
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();
    const { startDate, endDate } = useGlobalRangeDate();

    const { data: versionStats = [], isLoading } =
      trpc.application.versionStats.useQuery({
        workspaceId,
        applicationId,
        startAt: startDate.valueOf(),
        endAt: endDate.valueOf(),
      });

    const { data, chartConfig } = useMemo(() => {
      if (versionStats.length === 0) {
        return { data: [], chartConfig: {} };
      }

      const topVersions = versionStats.slice(0, MAX_DISPLAY_VERSIONS);
      const otherVersions = versionStats.slice(MAX_DISPLAY_VERSIONS);

      const displayData = [...topVersions];

      if (otherVersions.length > 0) {
        const otherCount = otherVersions.reduce(
          (acc, item) => acc + item.count,
          0
        );
        displayData.push({
          version: OTHER_VERSION_NAME,
          count: otherCount,
        });
      }

      const chartConfig: ChartConfig = {};
      displayData.forEach((item, i) => {
        chartConfig[`version-${i}`] = {
          label: item.version.startsWith('v')
            ? item.version
            : `v${item.version}`,
          color: `hsl(var(--chart-${(i % 5) + 1}))`,
        };
      });

      return {
        data: displayData.map((item, i) => ({
          label: item.version.startsWith('v')
            ? item.version
            : `v${item.version}`,
          count: item.count,
          fill: `var(--color-version-${i})`,
        })),
        chartConfig,
      };
    }, [versionStats]);

    if (isLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{t('Version Distribution')}</CardTitle>
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
            <CardTitle>{t('Version Distribution')}</CardTitle>
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
          <CardTitle>{t('Version Distribution')}</CardTitle>
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

ApplicationVersionChart.displayName = 'ApplicationVersionChart';
