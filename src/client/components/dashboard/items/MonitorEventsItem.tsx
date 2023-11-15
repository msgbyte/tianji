import React from 'react';
import { MonitorEventList } from '../../monitor/MonitorEventList';

export const MonitorEventsItem: React.FC<{
  monitorId: string;
}> = React.memo((props) => {
  return <MonitorEventList monitorId={props.monitorId} />;
});
MonitorEventsItem.displayName = 'MonitorEventsItem';
