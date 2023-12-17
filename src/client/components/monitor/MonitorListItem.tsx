import clsx from 'clsx';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppRouterOutput } from '../../api/trpc';
import { MonitorHealthBar } from './MonitorHealthBar';

type MonitorType = AppRouterOutput['monitor']['all'][number];

export const MonitorListItem: React.FC<{
  monitor: MonitorType;
  workspaceId: string;
  selectedMonitorId: string | null;
  setSelectedMonitorId: (monitorId: string) => void;
}> = React.memo((props) => {
  const { monitor, workspaceId, selectedMonitorId, setSelectedMonitorId } =
    props;
  const navigate = useNavigate();
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

  return (
    <div
      key={monitor.name}
      className={clsx(
        'flex rounded-lg py-3 px-4 cursor-pointer mb-1',
        selectedMonitorId === monitor.id
          ? 'bg-green-500 bg-opacity-20'
          : 'bg-green-500 bg-opacity-0 hover:bg-opacity-10'
      )}
      onClick={() => {
        navigate(`/monitor/${monitor.id}`);
        setSelectedMonitorId(monitor.id);
      }}
    >
      <div>
        <span
          className={clsx(
            'min-w-[62px] p-0.5 rounded-full text-white inline-block text-center',
            upPercent === 100 ? 'bg-green-400' : 'bg-amber-400'
          )}
        >
          {upPercent}%
        </span>
      </div>
      <div className="flex-1 pl-2">
        <div className="text-base">{monitor.name}</div>
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

      <div className="flex items-center">
        <MonitorHealthBar
          workspaceId={workspaceId}
          monitorId={monitor.id}
          onBeatsItemUpdate={setBeats}
        />
      </div>
    </div>
  );
});
MonitorListItem.displayName = 'MonitorListItem';
