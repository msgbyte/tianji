import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { Sparkline } from '@/components/chart/Sparkline';
import React from 'react';
import { getDateArray } from '@tianji/shared';
import { getUserTimezone } from '@/api/model/user';
import dayjs from 'dayjs';

export const AIGatewaySparkline: React.FC<{ gatewayId: string }> = React.memo(
  ({ gatewayId }) => {
    const workspaceId = useCurrentWorkspaceId();

    // Use insights API to get last 24 hours data
    const startDate = dayjs().subtract(24, 'hour').startOf('hour');
    const endDate = dayjs().endOf('hour');

    const { data = [], isLoading } = trpc.insights.query.useQuery(
      {
        workspaceId,
        insightId: gatewayId,
        insightType: 'aigateway',
        metrics: [{ name: '$all_event', math: 'events' }],
        filters: [],
        groups: [],
        time: {
          startAt: startDate.valueOf(),
          endAt: endDate.valueOf(),
          unit: 'hour',
          timezone: getUserTimezone(),
        },
      },
      {
        select(data) {
          const counts = data[0]?.data || [];

          if (counts.length === 0) {
            return [
              {
                value: 0,
              },
              {
                value: 0,
              },
              {
                value: 0,
              },
              {
                value: 0,
              },
              {
                value: 0,
              },
              {
                value: 0,
              },
              {
                value: 0,
              },
              {
                value: 0,
              },
            ];
          }

          return getDateArray(
            counts.map((item) => ({
              date: item.date,
              value: item.value,
            })),
            startDate,
            endDate,
            'hour'
          );
        },
        refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      }
    );

    if (isLoading) {
      return (
        <div className="flex h-10 w-20 items-center justify-center">
          <span className="text-muted-foreground text-xs">Loading...</span>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex h-10 w-20 items-center justify-center">
          <span className="text-muted-foreground text-xs">No data</span>
        </div>
      );
    }

    // Extract counts for sparkline
    const sparklineData = data.map((item) => item.value || 0);

    return (
      <div className="flex items-center gap-2">
        <Sparkline
          data={sparklineData}
          width={80}
          height={24}
          strokeWidth={1.5}
          showGradient={true}
        />
      </div>
    );
  }
);
AIGatewaySparkline.displayName = 'AIGatewaySparkline';
