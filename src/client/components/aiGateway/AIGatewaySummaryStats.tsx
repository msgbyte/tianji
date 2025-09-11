import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { Card } from '../ui/card';
import { useTranslation } from '@i18next-toolkit/react';
import { useGlobalRangeDate } from '@/hooks/useGlobalRangeDate';
import { getUserTimezone } from '@/api/model/user';
import { LoadingView } from '../LoadingView';

interface AIGatewaySummaryStatsProps {
  gatewayId: string;
}

export const AIGatewaySummaryStats: React.FC<AIGatewaySummaryStatsProps> =
  React.memo((props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const { startDate, endDate, unit } = useGlobalRangeDate();

    const { data: summaryData = [], isLoading } = trpc.insights.query.useQuery(
      {
        workspaceId,
        insightId: props.gatewayId,
        insightType: 'aigateway',
        metrics: [
          { name: '$all_event', math: 'events' },
          { name: 'inputToken', math: 'events' },
          { name: 'outputToken', math: 'events' },
          { name: 'price', math: 'events' },
        ],
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

          return data.map((metric, index) => {
            const metricNames = [
              '$all_event',
              'inputToken',
              'outputToken',
              'price',
            ];
            const counts = metric?.data || [];
            const total = counts.reduce((sum, item) => sum + item.value, 0);

            return {
              name: metricNames[index],
              total,
            };
          });
        },
      }
    );

    return (
      <LoadingView isLoading={isLoading}>
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {summaryData.map((metric) => {
              let label = '';
              let formattedValue = '';

              switch (metric.name) {
                case '$all_event':
                  label = t('Total Count');
                  formattedValue = metric.total.toLocaleString();
                  break;
                case 'inputToken':
                  label = t('Total Input Tokens');
                  formattedValue = metric.total.toLocaleString();
                  break;
                case 'outputToken':
                  label = t('Total Output Tokens');
                  formattedValue = metric.total.toLocaleString();
                  break;
                case 'price':
                  label = t('Total Price');
                  formattedValue = `$${metric.total.toFixed(4)}`;
                  break;
                default:
                  return null;
              }

              return (
                <Card key={metric.name} className="p-4">
                  <div>
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="text-2xl font-bold">{formattedValue}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </LoadingView>
    );
  });

AIGatewaySummaryStats.displayName = 'AIGatewaySummaryStats';
