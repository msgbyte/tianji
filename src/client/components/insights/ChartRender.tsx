import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { TimeEventChart } from '../chart/TimeEventChart';
import { MetricsInfo, useInsightsStore } from '@/store/insights';
import { pickColorWithNum } from '@/utils/color';
import { DateRangeSelection } from './DateRangeSelection';
import { DateUnitSelection } from './DateUnitSelection';
import { DateUnit } from '@tianji/shared';

interface ChartRenderProps {
  websiteId: string;
}
export const ChartRender: React.FC<ChartRenderProps> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();

  const metrics = useInsightsStore((state) =>
    state.currentMetrics.filter((item): item is MetricsInfo => Boolean(item))
  );
  const [dateKey, setDateKey] = useState('30D');
  const [dateRange, setDateRange] = useState(() => [
    dayjs().subtract(30, 'day').startOf('day').toDate(),
    dayjs().endOf('day').toDate(),
  ]);
  const [dateUnit, setDateUnit] = useState<DateUnit>('day');

  const time = useMemo(
    () => ({
      startAt: dateRange[0].valueOf(),
      endAt: dateRange[1].valueOf(),
      unit: dateUnit,
    }),
    [dateRange, dateUnit]
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
      <div className="mb-2 flex justify-between">
        <DateRangeSelection
          value={dateKey}
          onChange={(key, range) => {
            setDateKey(key);
            setDateRange(range);
          }}
        />

        <DateUnitSelection value={dateUnit} onChange={setDateUnit} />
      </div>

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
