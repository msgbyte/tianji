import { Card } from 'antd';
import React from 'react';
import { useParams } from 'react-router';
import { NotFoundTip } from '../../components/NotFoundTip';
import { useCurrentWorkspaceId } from '../../store/user';
import { TelemetryOverview } from '../../components/telemetry/TelemetryOverview';

export const TelemetryDetailPage: React.FC = React.memo(() => {
  const { telemetryId } = useParams();
  const workspaceId = useCurrentWorkspaceId();

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
      </Card>
    </div>
  );
});
TelemetryDetailPage.displayName = 'TelemetryDetailPage';
