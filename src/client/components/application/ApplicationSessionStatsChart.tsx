import React, { useMemo } from 'react';
import { sumBy } from 'lodash-es';
import { trpc, AppRouterInput } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useTranslation } from '@i18next-toolkit/react';
import { useGlobalRangeDate } from '@/hooks/useGlobalRangeDate';
import { BarList, BarListItem } from '../chart/BarList';
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
  labelClassName?: string;
}

export const ApplicationSessionStatsChart: React.FC<ApplicationSessionStatsChartProps> =
  React.memo((props) => {
    const { applicationId, groupBy, title, formatLabel, labelClassName } =
      props;
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

    const { data, total } = useMemo(() => {
      if (stats.length === 0) {
        return { data: [], total: 0 };
      }

      const topItems = stats.slice(0, MAX_DISPLAY_ITEMS);
      const otherItems = stats.slice(MAX_DISPLAY_ITEMS);

      const displayData = topItems.map((item) => ({ ...item, muted: false }));

      if (otherItems.length > 0) {
        const otherCount = otherItems.reduce(
          (acc, item) => acc + item.count,
          0
        );
        displayData.push({
          name: OTHER_NAME,
          count: otherCount,
          muted: true,
        });
      }

      const getLabel = (name: string) => {
        if (name === OTHER_NAME || name === 'Unknown') {
          return name;
        }
        return formatLabel ? formatLabel(name) : name;
      };

      return {
        data: displayData.map(
          (item): BarListItem => ({
            label: getLabel(item.name),
            count: item.count,
            muted: item.muted,
          })
        ),
        total: sumBy(displayData, 'count'),
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
        <CardHeader className="flex-row items-baseline justify-between space-y-0">
          <CardTitle>{title}</CardTitle>
          <span className="text-muted-foreground text-xs tabular-nums">
            {total.toLocaleString()} {t('Sessions')}
          </span>
        </CardHeader>
        <CardContent>
          <BarList
            aria-label={title}
            data={data}
            total={total}
            labelClassName={labelClassName}
          />
        </CardContent>
      </Card>
    );
  });

ApplicationSessionStatsChart.displayName = 'ApplicationSessionStatsChart';
