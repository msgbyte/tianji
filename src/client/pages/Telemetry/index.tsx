import React from 'react';
import { TelemetryList } from '../../components/telemetry/TelemetryList';
import { Route, Routes } from 'react-router-dom';
import { TelemetryDetailPage } from './Detail';

export const TelemetryPage: React.FC = React.memo(() => {
  return (
    <Routes>
      <Route path="/" element={<TelemetryList />} />
      <Route path="/:telemetryId" element={<TelemetryDetailPage />} />
    </Routes>
  );
});
TelemetryPage.displayName = 'TelemetryPage';
