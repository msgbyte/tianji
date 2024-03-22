import clsx from 'clsx';
import React, { useMemo, useState } from 'react';
import { MonitorHealthBar } from './MonitorHealthBar';
import { last } from 'lodash-es';
import { getMonitorProvider, getProviderDisplay } from './provider';
import { Tooltip } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';

export const MonitorListItem: React.FC<{
  className?: string;
  workspaceId: string;
  monitorId: string;
  monitorName: string;
  monitorType: string;
  showCurrentResponse?: boolean;
  onClick?: () => void;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const {
    className,
    workspaceId,
    monitorId,
    monitorName,
    monitorType,
    showCurrentResponse = false,
    onClick,
  } = props;

  const [beats, setBeats] = useState<
    ({
      value: number;
      createdAt: string | Date;
    } | null)[]
  >([]);

  const upPercent = useMemo(() => {
    let up = 0;
    beats.forEach((b) => {
      if (!b) {
        return;
      }

      if (b.value >= 0) {
        up++;
      }
    });

    return parseFloat(((up / beats.length) * 100).toFixed(1));
  }, [beats]);

  const provider = getMonitorProvider(monitorType);

  const latestResponse = useMemo((): string | false => {
    const val = last(beats)?.value;

    if (!val) {
      return false;
    }

    if (!provider) {
      return String(val);
    }

    const { text } = getProviderDisplay(val, provider);

    return text;
  }, [beats, provider]);

  return (
    <div
      className={clsx(
        className,
        'mb-1 flex items-center rounded-lg bg-green-500 bg-opacity-0 px-4 py-3 hover:bg-opacity-10',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div>
        <span
          className={clsx(
            'inline-block min-w-[62px] rounded-full p-0.5 text-center text-white',
            upPercent === 100 ? 'bg-green-400' : 'bg-amber-400'
          )}
        >
          {upPercent}%
        </span>
      </div>
      <div className="flex-1 pl-2">
        <div className="text-base">{monitorName}</div>
        {/* <div>
              {monitor.tags.map((tag) => (
                <span
                  className="py-0.5 px-1 rounded-full text-white text-sm"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.label}
                </span>
              ))}
            </div> */}
      </div>

      {showCurrentResponse && latestResponse && (
        <Tooltip title={t('Current')}>
          <div className="px-2 text-sm text-gray-800 dark:text-gray-400">
            {latestResponse}
          </div>
        </Tooltip>
      )}

      <div className="flex items-center">
        <MonitorHealthBar
          workspaceId={workspaceId}
          monitorId={monitorId}
          monitorType={monitorType}
          onBeatsItemUpdate={setBeats}
        />
      </div>
    </div>
  );
});
MonitorListItem.displayName = 'MonitorListItem';
