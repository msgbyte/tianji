import React, { useMemo } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { ErrorTip } from '../ErrorTip';
import { Loading } from '../Loading';
import { getMonitorProvider } from './provider';
import { MonitorStatsBlock } from './MonitorStatsBlock';
import { useTranslation } from '@i18next-toolkit/react';

export const MonitorDataMetrics: React.FC<{
  monitorId: string;
  monitorType: string;
  currectResponse?: number;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { monitorId, monitorType, currectResponse } = props;
  const { data, isLoading } = trpc.monitor.dataMetrics.useQuery(
    {
      workspaceId,
      monitorId,
    },
    {
      trpc: {
        context: {
          skipBatch: true,
        },
      },
    }
  );

  const provider = useMemo(
    () => getMonitorProvider(monitorType),
    [monitorType]
  );

  const providerOverview = useMemo(() => {
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
  }, [monitorId, provider]);

  const formatterFn = provider?.valueFormatter
    ? provider?.valueFormatter
    : (value: number) => `${value}ms`;

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
          title={t('Response')}
          desc={t('(Current)')}
          text={formatterFn(currectResponse)}
        />
      )}

      <MonitorStatsBlock
        title={t('Avg. Response')}
        desc={t('(24 hour)')}
        text={formatterFn(parseFloat(data.recent1DayAvg.toFixed(0)))}
      />
      <MonitorStatsBlock
        title={t('Uptime')}
        desc={t('(24 hour)')}
        text={`${parseFloat(
          (
            (data.recent1DayOnlineCount /
              (data.recent1DayOnlineCount + data.recent1DayOfflineCount)) *
            100
          ).toFixed(2)
        )} %`}
      />
      <MonitorStatsBlock
        title={t('Uptime')}
        desc={t('(30 days)')}
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
