import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { TimeEventChart } from '../chart/TimeEventChart';

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
  const metrics = [
    {
      name: '$all_event',
    },
  ];

  const { data } = trpc.website.insights.useQuery({
    workspaceId,
    websiteId: props.websiteId,
    metrics,
    time,
  });

  const chartConfig = useMemo(
    () =>
      metrics.reduce((prev, curr) => {
        return {
          ...prev,
          [curr.name]: {
            label: curr.name,
          },
        };
      }, {}),
    []
  );

  return (
    <div>
      {data && (
        <div>
          <TimeEventChart data={data} unit={'day'} chartConfig={chartConfig} />
        </div>
      )}
    </div>
  );
});
ChartRender.displayName = 'ChartRender';
