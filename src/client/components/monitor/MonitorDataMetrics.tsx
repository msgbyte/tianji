import React, { useMemo } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { ErrorTip } from '../ErrorTip';
import { Loading } from '../Loading';
import { getMonitorProvider } from '../modals/monitor/provider';
import { MonitorStatsBlock } from './MonitorStatsBlock';

export const MonitorDataMetrics: React.FC<{
  monitorId: string;
  monitorType: string;
  currectResponse?: number;
}> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const { monitorId, monitorType, currectResponse } = props;
  const { data, isLoading } = trpc.monitor.dataMetrics.useQuery({
    workspaceId,
    monitorId,
  });
  const providerOverview = useMemo(() => {
    const provider = getMonitorProvider(monitorType);
    if (!provider || !provider.overview) {
      return null;
    }

    return (
      <>
        {provider.overview.map((Component) => (
          <Component monitorId={monitorId} />
        ))}
      </>
    );
  }, [monitorId, monitorType]);

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return <ErrorTip />;
  }

  return (
    <div className="flex justify-between text-center">
      {typeof currectResponse === 'number' && (
        <MonitorStatsBlock
          title="Response"
          desc="(Current)"
          text={`${currectResponse} ms`}
        />
      )}

      <MonitorStatsBlock
        title="Avg. Response"
        desc="(24 hour)"
        text={`${parseFloat(data.recent1DayAvg.toFixed(0))} ms`}
      />
      <MonitorStatsBlock
        title="Uptime"
        desc="(24 hour)"
        text={`${parseFloat(
          (
            (data.recent1DayOnlineCount /
              (data.recent1DayOnlineCount + data.recent1DayOfflineCount)) *
            100
          ).toFixed(2)
        )} %`}
      />
      <MonitorStatsBlock
        title="Uptime"
        desc="(30 days)"
        text={`${parseFloat(
          (
            (data.recent30DayOnlineCount /
              (data.recent30DayOnlineCount + data.recent30DayOfflineCount)) *
            100
          ).toFixed(2)
        )} %`}
      />

      {providerOverview}
    </div>
  );
});
MonitorDataMetrics.displayName = 'MonitorDataMetrics';
