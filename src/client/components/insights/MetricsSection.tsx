import React from 'react';
import { MetricsBlock } from './MetricsBlock';
import { useInsightsStore } from '@/store/insights';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { sumBy } from 'lodash-es';
import { LuPlus } from 'react-icons/lu';

interface MetricsSectionProps {
  title: string;
}
export const MetricsSection: React.FC<MetricsSectionProps> = React.memo(
  (props) => {
    const workspaceId = useCurrentWorkspaceId();
    const selectedWebsiteId = useInsightsStore(
      (state) => state.selectedWebsiteId
    );
    const currentMetrics = useInsightsStore((state) => state.currentMetrics);
    const setMetrics = useInsightsStore((state) => state.setMetrics);
    const addMetrics = useInsightsStore((state) => state.addMetrics);

    const { data: allEvents = [] } = trpc.insights.events.useQuery(
      {
        workspaceId,
        websiteId: selectedWebsiteId,
      },
      {
        enabled: Boolean(selectedWebsiteId),
        select(data) {
          return [{ name: '$all_event', count: sumBy(data, 'count') }, ...data];
        },
      }
    );

    return (
      <div>
        <div
          className="hover:bg-muted mb-2 flex cursor-pointer items-center justify-between rounded-lg px-2 py-1"
          onClick={() => {
            addMetrics();
          }}
        >
          <div>{props.title}</div>
          <div>
            <LuPlus />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {currentMetrics.map((metric, i) => (
            <MetricsBlock
              key={i}
              index={i}
              list={allEvents}
              info={metric}
              onSelect={(info) => setMetrics(i, info)}
            />
          ))}
        </div>
      </div>
    );
  }
);
MetricsSection.displayName = 'MetricsSection';
