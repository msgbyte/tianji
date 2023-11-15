import React from 'react';
import { trpc } from '../../../api/trpc';
import { NotFoundTip } from '../../NotFoundTip';
import { useCurrentWorkspaceId } from '../../../store/user';
import { Loading } from '../../Loading';
import { MonitorDataMetrics } from '../../monitor/MonitorDataMetrics';

export const MonitorMetricsItem: React.FC<{
  monitorId: string;
}> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();

  const { data: monitorInfo, isLoading } = trpc.monitor.get.useQuery({
    workspaceId,
    monitorId: props.monitorId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!monitorInfo) {
    return <NotFoundTip />;
  }

  return (
    <MonitorDataMetrics
      monitorId={monitorInfo.id}
      monitorType={monitorInfo.type}
    />
  );
});
MonitorMetricsItem.displayName = 'MonitorMetricsItem';
