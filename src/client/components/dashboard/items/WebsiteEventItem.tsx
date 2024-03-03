import React from 'react';
import { WebsiteMetricsTable } from '../../website/WebsiteMetricsTable';
import { useGlobalRangeDate } from '../../../hooks/useGlobalRangeDate';

export const WebsiteEventItem: React.FC<{
  websiteId: string;
}> = React.memo((props) => {
  const { startDate, endDate } = useGlobalRangeDate();
  const startAt = startDate.valueOf();
  const endAt = endDate.valueOf();

  return (
    <WebsiteMetricsTable
      websiteId={props.websiteId}
      type="event"
      title={['Events', 'Actions']}
      startAt={startAt}
      endAt={endAt}
    />
  );
});
WebsiteEventItem.displayName = 'WebsiteEventItem';
