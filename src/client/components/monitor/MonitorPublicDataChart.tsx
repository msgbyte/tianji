import dayjs from 'dayjs';
import { get } from 'lodash-es';
import React, { useMemo } from 'react';
import { trpc } from '../../api/trpc';
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
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/hooks/useTheme';
import { CustomizedErrorArea } from './CustomizedErrorArea';

const chartConfig = {
  value: {
    label: <span className="text-sm font-bold">Result</span>,
  },
} satisfies ChartConfig;

interface MonitorPublicDataChartProps {
  workspaceId: string;
  monitorId: string;
  className?: string;
}

export const MonitorPublicDataChart: React.FC<MonitorPublicDataChartProps> =
  React.memo((props) => {
    const { t } = useTranslation();
    const { workspaceId, monitorId } = props;
    const { colors } = useTheme();

    const { data: monitorInfo } = trpc.monitor.getPublicInfo.useQuery(
      {
        monitorIds: [monitorId],
      },
      {
        select(data) {
          return data[0];
        },
      }
    );

    const { data: _data = [] } = trpc.monitor.publicData.useQuery({
      workspaceId,
      monitorId,
    });

    const providerInfo = getMonitorProvider(monitorInfo?.type ?? '');

    const { data } = useMemo(() => {
      const data = _data.map((d, i, arr) => {
        const value = d.value > 0 ? d.value : null;
        const time = dayjs(d.createdAt).valueOf();

        return {
          value,
          time,
        };
      });

      return { data };
    }, [_data]);

    const isTrendingMode = monitorInfo?.trendingMode ?? false; // if true, y axis not start from 0

    return (
      <div>
        <ChartContainer className="h-[120px] w-full" config={chartConfig}>
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
              tickFormatter={(date) => dayjs(date).format('HH:mm')}
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
  });
MonitorPublicDataChart.displayName = 'MonitorPublicDataChart';
