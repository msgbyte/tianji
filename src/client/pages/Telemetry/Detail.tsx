import { Card } from 'antd';
import React from 'react';
import { useParams } from 'react-router';
import { NotFoundTip } from '../../components/NotFoundTip';
import { useCurrentWorkspaceId } from '../../store/user';
import { TelemetryOverview } from '../../components/telemetry/TelemetryOverview';
import { TelemetryMetricsTable } from '../../components/telemetry/TelemetryMetricsTable';
import { useGlobalRangeDate } from '../../hooks/useGlobalRangeDate';
import { useTranslation } from '@i18next-toolkit/react';

export const TelemetryDetailPage: React.FC = React.memo(() => {
  const { telemetryId } = useParams();
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { startDate, endDate } = useGlobalRangeDate();

  const startAt = startDate.valueOf();
  const endAt = endDate.valueOf();

  if (!telemetryId) {
    return <NotFoundTip />;
  }

  return (
    <div className="py-6">
      <Card>
        <Card.Grid hoverable={false} className="!w-full">
          <TelemetryOverview
            telemetryId={telemetryId}
            showDateFilter={true}
            workspaceId={workspaceId}
          />
        </Card.Grid>

        <Card.Grid hoverable={false} className="min-h-[470px] !w-1/3">
          <TelemetryMetricsTable
            telemetryId={telemetryId}
            type="source"
            title={[t('Source'), t('Views')]}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>

        <Card.Grid hoverable={false} className="min-h-[470px] !w-1/3">
          <TelemetryMetricsTable
            telemetryId={telemetryId}
            type="event"
            title={[t('Events'), t('Views')]}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>

        <Card.Grid hoverable={false} className="min-h-[470px] !w-1/3">
          <TelemetryMetricsTable
            telemetryId={telemetryId}
            type="country"
            title={[t('Countries'), t('Visitors')]}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
      </Card>
    </div>
  );
});
TelemetryDetailPage.displayName = 'TelemetryDetailPage';
