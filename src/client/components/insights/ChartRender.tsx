import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { TimeEventChart } from '../chart/TimeEventChart';
import { useInsightsStore } from '@/store/insights';
import { pickColorWithNum } from '@/utils/color';
import { DateRangeSelection } from './DateRangeSelection';
import { DateUnitSelection } from './DateUnitSelection';
import { DateUnit, FilterInfo, MetricsInfo } from '@tianji/shared';
import { TableView } from './TableView';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../ui/resizable';
import { ScrollArea } from '../ui/scroll-area';
import { Empty } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';
import { DelayRender } from '../DelayRender';
import { SearchLoadingView } from '../loading/Searching';

interface ChartRenderProps {
  insightId: string;
  insightType: 'survey' | 'website';
}
export const ChartRender: React.FC<ChartRenderProps> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const metrics = useInsightsStore((state) =>
    state.currentMetrics.filter((item): item is MetricsInfo => Boolean(item))
  );
  const filters = useInsightsStore((state) =>
    state.currentFilters.filter((item): item is FilterInfo => Boolean(item))
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

  const { data, isFetching } = trpc.insights.query.useQuery({
    workspaceId,
    insightId: props.insightId,
    insightType: props.insightType,
    metrics,
    filters,
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

  let mainEl = null;
  if (isFetching) {
    mainEl = (
      <DelayRender>
        <SearchLoadingView className="pt-4" />
      </DelayRender>
    );
  } else if (data && Array.isArray(data)) {
    if (data.length === 0) {
      mainEl = (
        <Empty description={t("We couldn't find any data for your query.")} />
      );
    } else {
      mainEl = (
        <ResizablePanelGroup className="flex-1" direction="vertical">
          <ResizablePanel collapsedSize={1} className="flex flex-col">
            <div className="h-full p-4">
              <TimeEventChart
                className="h-full w-full"
                data={data}
                unit={dateUnit}
                chartConfig={chartConfig}
                drawGradientArea={false}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel>
            <ScrollArea className="h-full overflow-hidden p-4">
              <TableView metrics={metrics} data={data} dateUnit={dateUnit} />
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex justify-between p-4">
        <DateRangeSelection
          value={dateKey}
          onChange={(key, range) => {
            setDateKey(key);
            setDateRange(range);
          }}
        />

        <DateUnitSelection value={dateUnit} onChange={setDateUnit} />
      </div>

      {mainEl}
    </div>
  );
});
ChartRender.displayName = 'ChartRender';
