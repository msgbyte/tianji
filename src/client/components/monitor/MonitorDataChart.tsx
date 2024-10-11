import { Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { get, takeRight, uniqBy } from 'lodash-es';
import React, { useState, useMemo } from 'react';
import { useSocketSubscribeList } from '../../api/socketio';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { getMonitorProvider, getProviderDisplay } from './provider';
import { useTranslation } from '@i18next-toolkit/react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Customized,
  Rectangle,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/hooks/useTheme';

const chartConfig = {
  value: {
    label: <span className="text-sm font-bold">Result</span>,
  },
} satisfies ChartConfig;

export const MonitorDataChart: React.FC<{ monitorId: string }> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const { monitorId } = props;
    const [rangeType, setRangeType] = useState('recent');
    const { colors } = useTheme();
    const subscribedDataList = useSocketSubscribeList(
      'onMonitorReceiveNewData',
      {
        filter: (data) => {
          return data.monitorId === props.monitorId;
        },
      }
    );

    const range = useMemo((): [Dayjs, Dayjs] => {
      if (rangeType === '3h') {
        return [dayjs().subtract(3, 'hour'), dayjs()];
      }
      if (rangeType === '6h') {
        return [dayjs().subtract(6, 'hour'), dayjs()];
      }
      if (rangeType === '24h') {
        return [dayjs().subtract(24, 'hour'), dayjs()];
      }
      if (rangeType === '1w') {
        return [dayjs().subtract(1, 'week'), dayjs()];
      }

      return [dayjs().subtract(0.5, 'hour'), dayjs()];
    }, [rangeType]);

    const { data: monitorInfo } = trpc.monitor.get.useQuery({
      workspaceId,
      monitorId,
    });

    const { data: _recentData = [] } = trpc.monitor.recentData.useQuery({
      workspaceId,
      monitorId,
      take: 40,
    });

    const { data: _data = [] } = trpc.monitor.data.useQuery({
      workspaceId,
      monitorId,
      startAt: range[0].valueOf(),
      endAt: range[1].valueOf(),
    });

    const providerInfo = getMonitorProvider(monitorInfo?.type ?? '');

    const { data } = useMemo(() => {
      let fetchedData = rangeType === 'recent' ? _recentData : _data;
      const data = takeRight(
        uniqBy([...fetchedData, ...subscribedDataList], 'createdAt'),
        fetchedData.length
      ).map((d, i, arr) => {
        const value = d.value > 0 ? d.value : null;
        const time = dayjs(d.createdAt).valueOf();

        return {
          value,
          time,
        };
      });

      return { data };
    }, [_recentData, _data, subscribedDataList]);

    const isTrendingMode = monitorInfo?.trendingMode ?? false; // if true, y axis not start from 0

    return (
      <div>
        <div className="mb-4 text-right">
          <Select
            className="w-20 text-center"
            size="small"
            value={rangeType}
            onChange={(val) => setRangeType(val)}
          >
            <Select.Option value="recent">{t('Recent')}</Select.Option>
            <Select.Option value="3h">{t('3h')}</Select.Option>
            <Select.Option value="6h">{t('6h')}</Select.Option>
            <Select.Option value="24h">{t('24h')}</Select.Option>
            <Select.Option value="1w">{t('1w')}</Select.Option>
          </Select>
        </div>

        <ChartContainer className="h-[200px] w-full" config={chartConfig}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={colors.chart.monitor}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={colors.chart.monitor}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(date) =>
                dayjs(date).format(rangeType === '1w' ? 'MM-DD HH:mm' : 'HH:mm')
              }
            />
            <YAxis
              mirror
              domain={[isTrendingMode ? 'dataMin' : 0, 'dataMax']}
            />
            <CartesianGrid vertical={false} />
            <ChartTooltip
              labelFormatter={(label, payload) =>
                dayjs(get(payload, [0, 'payload', 'time'])).format(
                  'YYYY-MM-DD HH:mm:ss'
                )
              }
              formatter={(value, defaultText, item, index, payload) => {
                if (typeof value !== 'number') {
                  return defaultText;
                }
                const { name, text } = getProviderDisplay(
                  Number(value),
                  providerInfo
                );

                return (
                  <div>
                    <span className="mr-2">{name}:</span>
                    <span>{text}</span>
                  </div>
                );
              }}
              content={<ChartTooltipContent />}
            />

            <Customized component={CustomizedErrorArea} />

            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.chart.monitor}
              fillOpacity={1}
              fill="url(#color)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    );
  }
);
MonitorDataChart.displayName = 'MonitorDataChart';

const CustomizedErrorArea: React.FC = (props) => {
  const { colors } = useTheme();
  const y = get(props, 'offset.top', 10);
  const height = get(props, 'offset.height', 160);
  const points = get(props, 'formattedGraphicalItems.0.props.points', []) as {
    x: number;
    y: number | null;
  }[];

  const errorArea = useMemo(() => {
    const _errorArea: { x: number; width: number }[] = [];
    let prevX: number | null = null;
    points.forEach((item, i, arr) => {
      if (i === 0 && !item.y) {
        prevX = 0;
      } else if (!item.y && prevX === null && arr[i - 1].y) {
        prevX = arr[i - 1].x;
      } else if (item.y && prevX !== null) {
        _errorArea.push({
          x: prevX,
          width: item.x - prevX,
        });
        prevX = null;
      }
    });

    return _errorArea;
  }, [points]);

  return errorArea.map((area, i) => {
    return (
      <Rectangle
        key={i}
        width={area.width}
        height={height}
        x={area.x}
        y={y}
        fill={colors.chart.error}
      />
    );
  });
};
CustomizedErrorArea.displayName = 'CustomizedErrorArea';
