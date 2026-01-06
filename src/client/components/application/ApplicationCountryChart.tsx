import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { ApplicationSessionStatsChart } from './ApplicationSessionStatsChart';

interface ApplicationCountryChartProps {
  applicationId: string;
}

export const ApplicationCountryChart: React.FC<ApplicationCountryChartProps> =
  React.memo((props) => {
    const { applicationId } = props;
    const { t } = useTranslation();

    return (
      <ApplicationSessionStatsChart
        applicationId={applicationId}
        groupBy="country"
        title={t('Country Distribution')}
      />
    );
  });

ApplicationCountryChart.displayName = 'ApplicationCountryChart';
