import React from 'react';
import { WebsiteMetricsTable } from '../../website/WebsiteMetricsTable';
import { useGlobalRangeDate } from '../../../hooks/useGlobalRangeDate';
import { useTranslation } from '@i18next-toolkit/react';

export const WebsiteEventItem: React.FC<{
  websiteId: string;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const { startDate, endDate } = useGlobalRangeDate();
  const startAt = startDate.valueOf();
  const endAt = endDate.valueOf();

  return (
    <WebsiteMetricsTable
      websiteId={props.websiteId}
      type="event"
      title={[t('Events'), t('Actions')]}
      startAt={startAt}
      endAt={endAt}
    />
  );
});
WebsiteEventItem.displayName = 'WebsiteEventItem';
