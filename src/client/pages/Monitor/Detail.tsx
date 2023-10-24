import React from 'react';
import { useParams } from 'react-router';
import { ErrorTip } from '../../components/ErrorTip';
import { MonitorInfo } from '../../components/monitor/MonitorInfo';

export const MonitorDetail: React.FC = React.memo(() => {
  const { monitorId } = useParams();

  if (!monitorId) {
    return <ErrorTip />;
  }

  return (
    <div className="px-2 h-full">
      <MonitorInfo monitorId={monitorId} />
    </div>
  );
});
MonitorDetail.displayName = 'MonitorDetail';
