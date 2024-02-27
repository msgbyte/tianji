import { Button, message, Spin, Switch } from 'antd';
import React from 'react';
import { SyncOutlined } from '@ant-design/icons';
import { DateFilter } from '../DateFilter';
import { getDateArray } from '../../utils/date';
import { useEvent } from '../../hooks/useEvent';
import { MetricCard } from '../MetricCard';
import { useGlobalRangeDate } from '../../hooks/useGlobalRangeDate';
import { AppRouterOutput, trpc } from '../../api/trpc';
import { getUserTimezone } from '../../api/model/user';
import { useGlobalStateStore } from '../../store/global';
import { useTranslation } from '@i18next-toolkit/react';
import { TimeEventChart } from '../TimeEventChart';

export const TelemetryOverview: React.FC<{
  workspaceId: string;
  telemetryId: string;
  showDateFilter?: boolean;
  actions?: React.ReactNode;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const { workspaceId, telemetryId, showDateFilter = false, actions } = props;
  const { startDate, endDate, unit, refresh } = useGlobalRangeDate();
  const showPreviousPeriod = useGlobalStateStore(
    (state) => state.showPreviousPeriod
  );

  const { data: info } = trpc.telemetry.info.useQuery({
    workspaceId,
    telemetryId,
  });

  const {
    data: chartData = [],
    isLoading: isLoadingPageview,
    refetch: refetchPageview,
  } = trpc.telemetry.pageviews.useQuery(
    {
      workspaceId,
      telemetryId,
      startAt: startDate.valueOf(),
      endAt: endDate.valueOf(),
      unit,
      timezone: getUserTimezone(),
    },
    {
      select(data) {
        const pageviews = data.pageviews ?? [];
        const sessions = data.sessions ?? [];

        const pageviewsArr = getDateArray(pageviews, startDate, endDate, unit);
        const sessionsArr = getDateArray(sessions, startDate, endDate, unit);

        return [
          ...pageviewsArr.map((item) => ({ ...item, type: 'pageview' })),
          ...sessionsArr.map((item) => ({ ...item, type: 'session' })),
        ];
      },
    }
  );

  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = trpc.telemetry.stats.useQuery({
    workspaceId,
    telemetryId,
    startAt: startDate.unix() * 1000,
    endAt: endDate.unix() * 1000,
    timezone: getUserTimezone(),
    unit,
  });

  const handleRefresh = useEvent(async () => {
    refresh();

    await Promise.all([refetchPageview(), refetchStats()]);

    message.success(t('Refreshed'));
  });

  const loading = isLoadingPageview || isLoadingStats;

  return (
    <Spin spinning={loading}>
      <div className="flex">
        <div className="flex flex-1 text-2xl font-bold items-center">
          <span className="mr-2">{info?.name}</span>
        </div>

        <div>{actions}</div>
      </div>

      <div className="flex mb-10 flex-wrap justify-between">
        <div className="flex-1">{stats && <MetricsBar stats={stats} />}</div>

        <div className="flex items-center gap-2 justify-end flex-wrap w-full lg:w-1/3">
          <div className="mr-2">
            <Switch
              checked={showPreviousPeriod}
              onChange={(checked) =>
                useGlobalStateStore.setState({
                  showPreviousPeriod: checked,
                })
              }
            />
            <span className="ml-1">{t('Previous period')}</span>
          </div>

          <Button
            size="large"
            icon={<SyncOutlined />}
            onClick={handleRefresh}
          />

          {showDateFilter && (
            <div>
              <DateFilter />
            </div>
          )}
        </div>
      </div>

      <div>
        <TimeEventChart data={chartData} unit={unit} />
      </div>
    </Spin>
  );
});
TelemetryOverview.displayName = 'TelemetryOverview';

const MetricsBar: React.FC<{
  stats: AppRouterOutput['telemetry']['stats'];
}> = React.memo((props) => {
  const { t } = useTranslation();
  const { pageviews, uniques } = props.stats || {};

  return (
    <div className="flex gap-5 flex-wrap w-full">
      <MetricCard
        label={t('views')}
        value={pageviews.value}
        prev={pageviews.prev}
        change={pageviews.value - pageviews.prev}
      />
      <MetricCard
        label={t('visitors')}
        value={uniques.value}
        prev={uniques.prev}
        change={uniques.value - uniques.prev}
      />
    </div>
  );
});
MetricsBar.displayName = 'MetricsBar';
