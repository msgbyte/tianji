import React, { useMemo } from 'react';
import { useSocketSubscribeList } from '../../api/socketio';
import { takeRight, last } from 'lodash-es';
import { HealthBar, HealthBarBeat, HealthBarProps } from '../HealthBar';
import dayjs from 'dayjs';
import { trpc } from '../../api/trpc';
import { useWatch } from '../../hooks/useWatch';
import { getMonitorProvider, getProviderDisplay } from './provider';
import { MonitorProvider } from './provider/types';
import { useTranslation } from '@i18next-toolkit/react';

interface MonitorHealthBarProps {
  workspaceId: string;
  monitorId: string;
  monitorType?: string;
  count?: number;
  size?: HealthBarProps['size'];
  showCurrentStatus?: boolean;
  onBeatsItemUpdate?: (
    items: ({ value: number; createdAt: string | Date } | null)[]
  ) => void;
}
export const MonitorHealthBar: React.FC<MonitorHealthBarProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
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

    const provider = useMonitorProvider(monitorId, props.monitorType);

    const beats = useMemo(() => {
      return items.map((item): HealthBarBeat => {
        if (!item) {
          return {
            status: 'none',
          };
        }

        const { text } = getProviderDisplay(item.value, provider);

        const title = `${dayjs(item.createdAt).format(
          'YYYY-MM-DD HH:mm'
        )} | ${text}`;

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
    }, [items, provider]);

    useWatch([items], () => {
      props.onBeatsItemUpdate?.(items);
    });

    return (
      <div className="flex items-center justify-between">
        <HealthBar size={size} beats={beats} />

        {showCurrentStatus && (
          <>
            {last(beats)?.status === 'health' ? (
              <div className="rounded-full bg-green-500 px-4 py-1 text-lg font-bold text-white">
                {t('UP')}
              </div>
            ) : last(beats)?.status === 'error' ? (
              <div className="rounded-full bg-red-600 px-4 py-1 text-lg font-bold text-white">
                {t('DOWN')}
              </div>
            ) : (
              <div className="rounded-full bg-gray-400 px-4 py-1 text-lg font-bold text-white">
                {t('NONE')}
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);
MonitorHealthBar.displayName = 'MonitorHealthBar';

function useMonitorProvider(
  monitorId: string,
  monitorType?: string
): MonitorProvider | null {
  const { data: [monitorPublicInfo] = [] } =
    trpc.monitor.getPublicInfo.useQuery(
      {
        monitorIds: [monitorId],
      },
      {
        enabled: !monitorType,
      }
    );

  const type = monitorType ?? monitorPublicInfo?.type;

  return type ? getMonitorProvider(type) : null;
}
