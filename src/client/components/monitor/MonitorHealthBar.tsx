import React, { useMemo } from 'react';
import { useSocketSubscribeList } from '../../api/socketio';
import { takeRight, last } from 'lodash-es';
import { HealthBar, HealthBarBeat, HealthBarProps } from '../HealthBar';
import dayjs from 'dayjs';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { useWatch } from '../../hooks/useWatch';

interface MonitorHealthBarProps {
  workspaceId: string;
  monitorId: string;
  count?: number;
  size?: HealthBarProps['size'];
  showCurrentStatus?: boolean;
  onBeatsItemUpdate?: (
    items: ({ value: number; createdAt: string | Date } | null)[]
  ) => void;
}
export const MonitorHealthBar: React.FC<MonitorHealthBarProps> = React.memo(
  (props) => {
    const {
      workspaceId,
      monitorId,
      size,
      count = 20,
      showCurrentStatus = false,
    } = props;
    const { data: recent = [] } = trpc.monitor.recentData.useQuery({
      workspaceId,
      monitorId,
      take: count,
    });
    const newDataList = useSocketSubscribeList('onMonitorReceiveNewData', {
      filter: (data) => {
        return data.monitorId === props.monitorId;
      },
    });

    const items = useMemo(() => {
      return takeRight(
        [
          ...Array.from({ length: count }).map(() => null),
          ...recent,
          ...takeRight(newDataList, count),
        ],
        count
      );
    }, [newDataList, recent, count]);

    const beats = useMemo(() => {
      return items.map((item): HealthBarBeat => {
        if (!item) {
          return {
            status: 'none',
          };
        }

        const title = `${dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')} | ${
          item.value
        }ms`;

        if (item.value < 0) {
          return {
            title,
            status: 'error',
          };
        }

        return {
          title,
          status: 'health',
        };
      });
    }, [items]);

    useWatch([items], () => {
      props.onBeatsItemUpdate?.(items);
    });

    return (
      <div className="flex justify-between items-center">
        <HealthBar size={size} beats={beats} />

        {showCurrentStatus && (
          <>
            {last(beats)?.status === 'health' ? (
              <div className="bg-green-500 text-white px-4 py-1 rounded-full text-lg font-bold">
                UP
              </div>
            ) : last(beats)?.status === 'error' ? (
              <div className="bg-red-600 text-white px-4 py-1 rounded-full text-lg font-bold">
                DOWN
              </div>
            ) : (
              <div className="bg-gray-400 text-white px-4 py-1 rounded-full text-lg font-bold">
                NONE
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);
MonitorHealthBar.displayName = 'MonitorHealthBar';
