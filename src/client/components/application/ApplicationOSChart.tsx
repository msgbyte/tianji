import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { ApplicationSessionStatsChart } from './ApplicationSessionStatsChart';

interface ApplicationOSChartProps {
  applicationId: string;
}

export const ApplicationOSChart: React.FC<ApplicationOSChartProps> = React.memo(
  (props) => {
    const { applicationId } = props;
    const { t } = useTranslation();

    return (
      <ApplicationSessionStatsChart
        applicationId={applicationId}
        groupBy="os"
        title={t('OS Distribution')}
      />
    );
  }
);

ApplicationOSChart.displayName = 'ApplicationOSChart';
