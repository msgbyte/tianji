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
import clsx from 'clsx';
import { cn } from '@/utils/style';

interface MonitorHealthBarProps {
  workspaceId: string;
  monitorId: string;
  monitorType?: string;
  active?: boolean;
  count?: number;
  size?: HealthBarProps['size'];
  healthBarClassName?: string;
  showCurrentStatus?: boolean;
  showPercent?: boolean;
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
      active = true,
      size = 'small',
      count = 20,
      showCurrentStatus = false,
      showPercent = false,
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

    const upPercent = useMemo(() => {
      let up = 0;
      beats.forEach((b) => {
        if (!b) {
          return;
        }

        if (b.status === 'health') {
          up++;
        }
      });

      return parseFloat(((up / beats.length) * 100).toFixed(1));
    }, [beats]);

    useWatch([items], () => {
      props.onBeatsItemUpdate?.(items);
    });

    return (
      <div
        className={cn('flex items-center', active === false && 'opacity-50')}
      >
        {showPercent && (
          <span
            className={clsx(
              'mr-2 inline-block min-w-[62px] rounded-full p-0.5 text-center text-white',
              upPercent === 100 ? 'bg-green-400' : 'bg-amber-400',
              {
                'min-w-[50px] text-sm': size === 'small',
              }
            )}
          >
            {upPercent}%
          </span>
        )}

        <div className="flex-1 overflow-hidden">
          <HealthBar
            className={props.healthBarClassName}
            size={size}
            beats={beats}
          />
        </div>

        {showCurrentStatus && (
          <>
            {active === false ? (
              <div
                className={clsx(
                  'ml-2 rounded-full bg-gray-400 px-4 py-1 text-lg font-bold text-white',
                  {
                    'text-sm': size === 'small',
                  }
                )}
              >
                {t('Stopped')}
              </div>
            ) : last(beats)?.status === 'health' ? (
              <div
                className={clsx(
                  'ml-2 rounded-full bg-green-500 px-4 py-1 text-lg font-bold text-white',
                  {
                    'text-sm': size === 'small',
                  }
                )}
              >
                {`UP`}
              </div>
            ) : last(beats)?.status === 'error' ? (
              <div
                className={clsx(
                  'ml-2 rounded-full bg-red-600 px-4 py-1 text-lg font-bold text-white',
                  {
                    'text-sm': size === 'small',
                  }
                )}
              >
                {`DOWN`}
              </div>
            ) : (
              <div
                className={clsx(
                  'ml-2 rounded-full bg-gray-400 px-4 py-1 text-lg font-bold text-white',
                  {
                    'text-sm': size === 'small',
                  }
                )}
              >
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
