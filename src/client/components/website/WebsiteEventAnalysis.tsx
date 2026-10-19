import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Empty } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';
import { useQuery } from '@tanstack/react-query';

import { trpc } from '@/api/trpc';
import { getUserTimezone } from '@/api/model/user';
import { TimeEventChart } from '@/components/chart/TimeEventChart';
import { LoadingView } from '@/components/LoadingView';
import { InsightsRawData, useInsightsData } from '@/hooks/useInsightsData';
import { useCurrentWorkspaceId } from '@/store/user';
import { useGlobalStateStore } from '@/store/global';

const MAX_EVENT_SERIES = 5;

export const WebsiteEventAnalysis: React.FC<{
  websiteId: string;
}> = React.memo((props) => {
  const { websiteId } = props;
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { client } = trpc.useUtils();
  const rangeDateRefreshKey = useGlobalStateStore(
    (state) => state.rangeDateRefreshKey
  );

  const { startAt, endAt } = useMemo(() => {
    const end = dayjs().endOf('hour');
    const start = end.subtract(24, 'hour');

    return {
      startAt: start.valueOf(),
      endAt: end.valueOf(),
    };
  }, [websiteId, rangeDateRefreshKey]);

  const time = {
    startAt,
    endAt,
    unit: 'hour' as const,
    timezone: getUserTimezone(),
  };
  const { data: rawData = [], isLoading } = useQuery({
    queryKey: ['websiteEventAnalysis', { workspaceId, websiteId }, time],
    queryFn: async ({ signal }) => {
      // Keep both requests in one query so refresh waits for the event chart.
      const options = { signal, context: { skipBatch: true } };
      const eventMetrics = await client.website.metrics.query(
        { workspaceId, websiteId, type: 'event', startAt, endAt },
        options
      );
      const metrics = eventMetrics
        .filter((item) => Boolean(item.x))
        .slice(0, MAX_EVENT_SERIES)
        .map((item) => ({
          name: String(item.x),
          math: 'events' as const,
          alias: String(item.x),
        }));

      if (metrics.length === 0) {
        return [];
      }

      return client.insights.query.query(
        {
          workspaceId,
          insightId: websiteId,
          insightType: 'website',
          metrics,
          filters: [],
          groups: [],
          time,
        },
        options
      );
    },
  });
  const { chartData, chartConfig, simpleData, isMultiSeries } = useInsightsData(
    {
      data: rawData as InsightsRawData[],
      groups: [],
      time,
    }
  );
  const data = isMultiSeries ? chartData : simpleData;

  return (
    <div className="flex h-full flex-col gap-4">
      <LoadingView isLoading={isLoading} className="flex-1">
        {rawData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Empty description={t('No event data yet')} />
          </div>
        ) : (
          <TimeEventChart
            key={data.length}
            className="h-[320px]"
            data={data}
            unit={time.unit}
            chartConfig={chartConfig}
            chartType="bar"
          />
        )}
      </LoadingView>
    </div>
  );
});
WebsiteEventAnalysis.displayName = 'WebsiteEventAnalysis';
