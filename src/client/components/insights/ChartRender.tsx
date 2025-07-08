import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { TimeEventChart, TimeEventChartType } from '../chart/TimeEventChart';
import { useInsightsStore } from '@/store/insights';
import { pickColorWithNum } from '@/utils/color';
import { DateRangeSelection } from './DateRangeSelection';
import { DateUnitSelection } from './DateUnitSelection';
import { DateUnit, FilterInfo, GroupInfo, MetricsInfo } from '@tianji/shared';
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
import { get, groupBy, merge, omit, values } from 'lodash-es';
import { ChartTypeSelection } from './ChartTypeSelection';
import { useWatch } from '@/hooks/useWatch';
import { getUserTimezone } from '@/api/model/user';

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
  const groups = useInsightsStore((state) =>
    state.currentGroups.filter((item): item is GroupInfo => Boolean(item))
  );
  const dateKey = useInsightsStore((state) => state.currentDateKey);
  const dateRange = useInsightsStore((state) => state.currentDateRange);
  const dateUnit = useInsightsStore((state) => state.currentDateUnit);
  const chartType = useInsightsStore((state) => state.currentChartType);
  const setDateKey = useInsightsStore((state) => state.setCurrentDateKey);
  const setDateRange = useInsightsStore((state) => state.setCurrentDateRange);
  const setDateUnit = useInsightsStore((state) => state.setCurrentDateUnit);
  const setChartType = useInsightsStore((state) => state.setCurrentChartType);

  const allowMinute = useMemo(() => {
    const start = dayjs(dateRange[0]);
    const end = dayjs(dateRange[1]);
    return end.diff(start, 'day') <= 1;
  }, [dateRange]);

  useWatch([allowMinute, dateUnit], () => {
    if (!allowMinute && dateUnit === 'minute') {
      setDateUnit('day');
    }
  });

  const time = useMemo(
    () => ({
      startAt: dayjs(dateRange[0]).valueOf(),
      endAt: dayjs(dateRange[1]).valueOf(),
      unit: dateUnit,
      timezone: getUserTimezone(),
    }),
    [dateRange, dateUnit]
  );

  const { data = [], isFetching } = trpc.insights.query.useQuery({
    workspaceId,
    insightId: props.insightId,
    insightType: props.insightType,
    metrics,
    filters,
    groups,
    time,
  });

  const chartData = useMemo(() => {
    const res: { date: string }[] = [];
    if (!data || data.length === 0) {
      return [];
    }

    const dates = data[0].data.map((item) => item.date);

    dates.map((date) => {
      data.forEach((item) => {
        const value = item.data.find((d) => d.date === date)?.value ?? 0;
        let name = item.name;

        if (groups.length > 0) {
          name +=
            '-' +
            groups
              .map((group) => {
                return get(item, group.value);
              })
              .join('-');
        }

        res.push({
          date,
          [name]: value,
        });
      });
    });

    return values(groupBy(res, 'date')).map((list) => (merge as any)(...list));
  }, [data]);

  const chartConfig = useMemo(() => {
    if (chartData.length === 0) {
      return {};
    }

    return Object.keys(omit(chartData[0], 'date')).reduce((prev, curr, i) => {
      return {
        ...prev,
        [curr]: {
          label: curr,
          color: pickColorWithNum(i),
        },
      };
    }, {});
  }, [chartData]);

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
                data={chartData}
                unit={dateUnit}
                chartConfig={chartConfig}
                drawGradientArea={false}
                chartType={chartType}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel>
            <ScrollArea className="h-full overflow-hidden p-4">
              <TableView
                metrics={metrics}
                groups={groups}
                data={data}
                dateUnit={dateUnit}
              />
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

        <div className="flex gap-2">
          <DateUnitSelection
            allowMinute={allowMinute}
            value={dateUnit}
            onChange={setDateUnit}
          />
          <ChartTypeSelection value={chartType} onChange={setChartType} />
        </div>
      </div>

      {mainEl}
    </div>
  );
});
ChartRender.displayName = 'ChartRender';
