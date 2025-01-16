import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { TimeEventChart } from '../chart/TimeEventChart';
import { MetricsInfo, useInsightsStore } from '@/store/insights';
import { pickColorWithNum } from '@/utils/color';

interface ChartRenderProps {
  websiteId: string;
}
export const ChartRender: React.FC<ChartRenderProps> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const time = useMemo(
    () => ({
      startAt: dayjs().subtract(7, 'days').valueOf(),
      endAt: dayjs().endOf('days').valueOf(),
      unit: 'day' as const,
    }),
    []
  );
  const metrics = useInsightsStore((state) =>
    state.currentMetrics.filter((item): item is MetricsInfo => Boolean(item))
  );

  const { data } = trpc.insights.query.useQuery({
    workspaceId,
    websiteId: props.websiteId,
    metrics,
    time,
  });

  const chartConfig = useMemo(
    () =>
      metrics.reduce((prev, curr, i) => {
        return {
          ...prev,
          [curr.name]: {
            label: curr.name,
            color: pickColorWithNum(i),
          },
        };
      }, {}),
    [metrics]
  );

  return (
    <div>
      {data && (
        <div>
          <TimeEventChart
            data={data}
            unit={'day'}
            chartConfig={chartConfig}
            drawGradientArea={false}
          />
        </div>
      )}
    </div>
  );
});
ChartRender.displayName = 'ChartRender';
