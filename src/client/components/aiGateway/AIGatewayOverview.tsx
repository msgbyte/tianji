import React, { useMemo, useState } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { TimeEventChart } from '../chart/TimeEventChart';
import { Spin } from 'antd';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { DateFilter } from '../DateFilter';
import { useTranslation } from '@i18next-toolkit/react';
import { useGlobalRangeDate } from '@/hooks/useGlobalRangeDate';
import { getDateArray } from '@tianji/shared';
import colors from 'tailwindcss/colors';
import { getUserTimezone } from '@/api/model/user';

interface AIGatewayOverviewProps {
  gatewayId: string;
}
export const AIGatewayOverview: React.FC<AIGatewayOverviewProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();

    const { startDate, endDate, unit } = useGlobalRangeDate();
    const [type, setType] = useState<
      '$all_event' | 'inputToken' | 'outputToken' | 'price'
    >('price');

    const { data = [], isLoading } = trpc.insights.query.useQuery(
      {
        workspaceId,
        insightId: props.gatewayId,
        insightType: 'aigateway',
        metrics: [{ name: type, math: 'events' }],
        filters: [],
        groups: [],
        time: {
          startAt: startDate.valueOf(),
          endAt: endDate.valueOf(),
          unit,
        },
      },
      {
        select(data) {
          if (!data || data.length === 0) {
            return [];
          }

          const counts = data[0]?.data || [];
          return getDateArray(
            counts.map((item) => ({
              date: item.date,
              value: item.value,
            })),
            startDate,
            endDate,
            unit,
            getUserTimezone()
          );
        },
      }
    );

    const chartConfig = useMemo(() => {
      let info = {
        label: t('AIGateway Count'),
        color: colors.blue[500],
      };

      if (type === 'inputToken') {
        info = {
          label: t('AIGateway Input Token'),
          color: colors.blue[500],
        };
      } else if (type === 'outputToken') {
        info = {
          label: t('AIGateway Output Token'),
          color: colors.blue[500],
        };
      } else if (type === 'price') {
        info = {
          label: t('AIGateway Price'),
          color: colors.blue[500],
        };
      }

      return {
        value: info,
      };
    }, [t]);

    const valueFormatter = useMemo(() => {
      return (value: number) => {
        if (type === 'price') {
          return `$${value}`;
        } else {
          return String(value);
        }
      };
    }, [type]);

    return (
      <Spin spinning={isLoading}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('AIGateway Statistics')}</h2>
          <DateFilter />
        </div>

        <div className="rounded-md shadow">
          <div className="mb-4 flex items-center justify-end">
            <Select value={type} onValueChange={(val) => setType(val as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$all_event">{t('Count')}</SelectItem>
                <SelectItem value="inputToken">{t('Input Token')}</SelectItem>
                <SelectItem value="outputToken">{t('Output Token')}</SelectItem>
                <SelectItem value="price">{t('Price')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TimeEventChart
            data={data}
            unit={unit}
            chartConfig={chartConfig}
            chartType="area"
            valueFormatter={valueFormatter}
          />
        </div>
      </Spin>
    );
  }
);
AIGatewayOverview.displayName = 'AIGatewayOverview';
