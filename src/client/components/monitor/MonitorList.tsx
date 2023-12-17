import React, { useMemo, useState } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { NoWorkspaceTip } from '../NoWorkspaceTip';
import { Loading } from '../Loading';
import { Empty } from 'antd';
import { MonitorListItem } from './MonitorListItem';

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
          workspaceId={workspaceId}
          selectedMonitorId={selectedMonitorId}
          setSelectedMonitorId={setSelectedMonitorId}
        />
      ))}
    </div>
  );
});
MonitorList.displayName = 'MonitorList';
