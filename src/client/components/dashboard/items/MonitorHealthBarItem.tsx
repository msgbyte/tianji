import React from 'react';
import { MonitorHealthBar } from '../../monitor/MonitorHealthBar';
import { useCurrentWorkspaceId } from '../../../store/user';

export const MonitorHealthBarItem: React.FC<{
  monitorId: string;
}> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();

  return (
    <MonitorHealthBar
      workspaceId={workspaceId}
      monitorId={props.monitorId}
      count={40}
      size="large"
      showCurrentStatus={true}
    />
  );
});
MonitorHealthBarItem.displayName = 'MonitorHealthBarItem';
