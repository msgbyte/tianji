import clsx from 'clsx';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { NoWorkspaceTip } from '../NoWorkspaceTip';
import { MonitorHealthBar } from './MonitorHealthBar';

export const MonitorList: React.FC = React.memo(() => {
  const currentWorkspaceId = useCurrentWorkspaceId()!;
  const { data: monitors = [] } = trpc.monitor.all.useQuery({
    workspaceId: currentWorkspaceId,
  });
  const navigate = useNavigate();
  const initMonitorId = useMemo(() => {
    const pathname = window.location.pathname;
    const re = /^\/monitor\/([^\/]+?)$/;
    if (re.test(pathname)) {
      const id = pathname.match(re)?.[1];

      if (typeof id === 'string') {
        return id;
      }
    }

    return null;
  }, []);
  const [beats, setBeats] = useState<
    ({
      value: number;
      createdAt: string | Date;
    } | null)[]
  >([]);

  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(
    initMonitorId
  );

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

  if (!currentWorkspaceId) {
    return <NoWorkspaceTip />;
  }

  return (
    <div>
      {monitors.map((monitor) => (
        <div
          key={monitor.name}
          className={clsx(
            'flex rounded-lg py-3 px-4 cursor-pointer',
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
              monitorId={monitor.id}
              onBeatsItemUpdate={setBeats}
            />
          </div>
        </div>
      ))}
    </div>
  );
});
MonitorList.displayName = 'MonitorList';
