import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { formatNumber } from '../../utils/common';

export const TelemetryCounter: React.FC<{
  telemetryId: string;
}> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const { data = 0 } = trpc.telemetry.eventCount.useQuery({
    workspaceId,
    telemetryId: props.telemetryId,
  });

  return <span>{formatNumber(data)}</span>;
});
TelemetryCounter.displayName = 'TelemetryCounter';
