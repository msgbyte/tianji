import React from 'react';
import { TelemetryList } from '../../components/telemetry/TelemetryList';

export const TelemetryPage: React.FC = React.memo(() => {
  return <TelemetryList />;
});
TelemetryPage.displayName = 'TelemetryPage';
