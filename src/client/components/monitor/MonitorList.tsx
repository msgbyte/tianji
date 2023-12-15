import clsx from 'clsx';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppRouterOutput, trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { NoWorkspaceTip } from '../NoWorkspaceTip';
import { MonitorHealthBar } from './MonitorHealthBar';
import { Loading } from '../Loading';
import { Empty } from 'antd';

type MonitorType = AppRouterOutput['monitor']['all'][number];

export const MonitorList: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const { data: monitors = [], isLoading } = trpc.monitor.all.useQuery({
    workspaceId,
  });
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

  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(
    initMonitorId
  );

  if (!workspaceId) {
    return <NoWorkspaceTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="p-2">
      {monitors.length === 0 && <Empty description="Here is no monitor yet." />}

      {monitors.map((monitor) => (
        <MonitorListItem
          key={monitor.id}
          monitor={monitor}
          selectedMonitorId={selectedMonitorId}
          setSelectedMonitorId={setSelectedMonitorId}
        />
      ))}
    </div>
  );
});
MonitorList.displayName = 'MonitorList';

export const MonitorListItem: React.FC<{
  monitor: MonitorType;
  selectedMonitorId: string | null;
  setSelectedMonitorId: (monitorId: string) => void;
}> = React.memo((props) => {
  const { monitor, selectedMonitorId, setSelectedMonitorId } = props;
  const navigate = useNavigate();
  const workspaceId = useCurrentWorkspaceId();
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
