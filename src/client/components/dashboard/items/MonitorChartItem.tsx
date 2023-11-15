import React from 'react';
import { MonitorDataChart } from '../../monitor/MonitorDataChart';

export const MonitorChartItem: React.FC<{
  monitorId: string;
}> = React.memo((props) => {
  return <MonitorDataChart monitorId={props.monitorId} />;
});
MonitorChartItem.displayName = 'MonitorChartItem';
