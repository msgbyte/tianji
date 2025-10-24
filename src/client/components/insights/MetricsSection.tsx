import React, { useMemo } from 'react';
import { MetricsBlock } from './MetricsBlock';
import { useInsightsStore } from '@/store/insights';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { sumBy } from 'lodash-es';
import { LuPlus } from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { getMetricLabel } from './utils/common';

const defaultMetrics = [{ name: '$all_event', count: 0 }];

export const MetricsSection: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const insightId = useInsightsStore((state) => state.insightId);
  const insightType = useInsightsStore((state) => state.insightType);
  const currentMetrics = useInsightsStore((state) => state.currentMetrics);
  const setMetrics = useInsightsStore((state) => state.setMetrics);
  const addMetrics = useInsightsStore((state) => state.addMetrics);
  const removeMetrics = useInsightsStore((state) => state.removeMetrics);
  const { t } = useTranslation();

  const { data: allEvents = defaultMetrics } =
    trpc.insights.eventNames.useQuery(
      {
        workspaceId,
        insightId,
        insightType,
      },
      {
        enabled: Boolean(insightId),
        select(data) {
          return [{ name: '$all_event', count: sumBy(data, 'count') }, ...data];
        },
        trpc: {
          context: {
            skipBatch: true,
          },
        },
      }
    );

  const list = useMemo(() => {
    return allEvents.map((event) => ({
      name: event.name,
      label: getMetricLabel(event.name),
      count: event.count,
    }));
  }, [allEvents]);

  return (
    <div>
      <div
        className="hover:bg-muted mb-2 flex cursor-pointer items-center justify-between rounded-lg px-2 py-1"
        onClick={() => {
          addMetrics();
        }}
      >
        <div>{t('Metrics')}</div>
        <div>
          <LuPlus />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {currentMetrics.map((metric, i) => (
          <MetricsBlock
            key={i}
            index={i}
            list={list}
            info={metric}
            onSelect={(info) => setMetrics(i, info)}
            onDelete={() => removeMetrics(i)}
          />
        ))}
      </div>
    </div>
  );
});
MetricsSection.displayName = 'MetricsSection';
