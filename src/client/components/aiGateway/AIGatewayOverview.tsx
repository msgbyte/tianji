import React, { useMemo, useState } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { TimeEventChart } from '../chart/TimeEventChart';
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
import { AIGatewaySummaryStats } from './AIGatewaySummaryStats';
import { AIGatewayQuotaStatus } from './AIGatewayQuotaStatus';
import { AIGatewayQuotaAlertModal } from './AIGatewayQuotaAlertModal';
import { LoadingView } from '../LoadingView';
import { Button } from '../ui/button';
import { LuRefreshCw } from 'react-icons/lu';
import { useEvent } from '@/hooks/useEvent';

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
    const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

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
          timezone: getUserTimezone(),
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
            unit
          );
        },
      }
    );

    const chartConfig = useMemo(() => {
      if (type === 'inputToken') {
        return {
          value: {
            label: t('AIGateway Input Token'),
            color: colors.blue[500],
          },
        };
      } else if (type === 'outputToken') {
        return {
          value: {
            label: t('AIGateway Output Token'),
            color: colors.blue[500],
          },
        };
      } else if (type === 'price') {
        return {
          value: {
            label: t('AIGateway Price'),
            color: colors.blue[500],
          },
        };
      }

      return {
        value: {
          label: t('AIGateway Count'),
          color: colors.blue[500],
        },
      };
    }, [t, type]);

    const valueFormatter = useMemo(() => {
      return (value: number) => {
        if (type === 'price') {
          return `$${value}`;
        } else {
          return String(value);
        }
      };
    }, [type]);

    const trpcUtils = trpc.useUtils();
    const handleRefresh = useEvent(async () => {
      trpcUtils.insights.query.reset({
        workspaceId,
        insightId: props.gatewayId,
        insightType: 'aigateway',
      } as any); // use partial type to avoid reset more info.
    });

    return (
      <LoadingView isLoading={isLoading}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('Statistics')}</h2>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={handleRefresh}
              title={t('Refresh')}
            >
              <LuRefreshCw className="h-4 w-4" />
            </Button>
            <DateFilter />
          </div>
        </div>

        <AIGatewaySummaryStats gatewayId={props.gatewayId} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-md shadow">
              <div className="mb-4 flex items-center justify-end">
                <Select
                  value={type}
                  onValueChange={(val) => setType(val as any)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$all_event">{t('Count')}</SelectItem>
                    <SelectItem value="inputToken">
                      {t('Input Token')}
                    </SelectItem>
                    <SelectItem value="outputToken">
                      {t('Output Token')}
                    </SelectItem>
                    <SelectItem value="price">{t('Price')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <TimeEventChart
                data={data}
                unit={unit}
                chartConfig={chartConfig}
                chartType="bar"
                valueFormatter={valueFormatter}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <AIGatewayQuotaStatus
              gatewayId={props.gatewayId}
              onOpenQuotaSettings={() => setIsQuotaModalOpen(true)}
            />
          </div>
        </div>

        <AIGatewayQuotaAlertModal
          isOpen={isQuotaModalOpen}
          onClose={() => setIsQuotaModalOpen(false)}
          gatewayId={props.gatewayId}
        />
      </LoadingView>
    );
  }
);
AIGatewayOverview.displayName = 'AIGatewayOverview';
