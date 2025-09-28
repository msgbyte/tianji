import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Empty } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';

import { trpc } from '@/api/trpc';
import { InsightQueryChart } from '@/components/insights/InsightQueryChart';
import { LoadingView } from '@/components/LoadingView';
import { useCurrentWorkspaceId } from '@/store/user';

const MAX_EVENT_SERIES = 5;

export const WebsiteEventAnalysis: React.FC<{
  websiteId: string;
}> = React.memo((props) => {
  const { websiteId } = props;
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const { startAt, endAt } = useMemo(() => {
    const end = dayjs().endOf('hour');
    const start = end.subtract(24, 'hour');

    return {
      startAt: start.valueOf(),
      endAt: end.valueOf(),
    };
  }, [websiteId]);

  const { data: eventMetrics = [], isLoading: isLoadingEventMetrics } =
    trpc.website.metrics.useQuery(
      {
        workspaceId,
        websiteId,
        type: 'event',
        startAt,
        endAt,
      },
      {
        trpc: {
          context: {
            skipBatch: true,
          },
        },
      }
    );

  const metricsConfig = useMemo(() => {
    return eventMetrics
      .filter((item) => Boolean(item.x))
      .slice(0, MAX_EVENT_SERIES)
      .map((item) => ({
        name: String(item.x),
        math: 'events' as const,
        alias: String(item.x),
      }));
  }, [eventMetrics]);

  return (
    <div className="flex h-full flex-col gap-4">
      <LoadingView isLoading={isLoadingEventMetrics} className="flex-1">
        {metricsConfig.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Empty description={t('No event data yet')} />
          </div>
        ) : (
          <InsightQueryChart
            className="h-[320px]"
            workspaceId={workspaceId}
            insightId={websiteId}
            insightType="website"
            metrics={metricsConfig}
            filters={[]}
            groups={[]}
            time={{
              startAt,
              endAt,
              unit: 'hour',
            }}
            chartType="bar"
          />
        )}
      </LoadingView>
    </div>
  );
});
WebsiteEventAnalysis.displayName = 'WebsiteEventAnalysis';
