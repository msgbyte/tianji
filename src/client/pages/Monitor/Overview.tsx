import React from 'react';
import { useCurrentWorkspaceId } from '../../store/user';
import { trpc } from '../../api/trpc';
import { Card } from 'antd';
import { MonitorEventList } from '../../components/monitor/MonitorEventList';

export const MonitorOverview: React.FC = React.memo(() => {
  const currentWorkspaceId = useCurrentWorkspaceId()!;
  const { data: monitors = [] } = trpc.monitor.all.useQuery({
    workspaceId: currentWorkspaceId,
  });

  return (
    <div className="px-2">
      <div className="grid gap-4 grid-cols-2">
        <Card hoverable={true}>
          <div>Monitors</div>
          <div className="text-2xl font-semibold">{monitors.length}</div>
        </Card>
        <Card hoverable={true}>
          <div>Available</div>
          <div className="text-2xl font-semibold">
            {monitors.filter((m) => m.active).length}
          </div>
        </Card>
      </div>
      <div>
        <MonitorEventList />
      </div>
    </div>
  );
});
MonitorOverview.displayName = 'MonitorOverview';
