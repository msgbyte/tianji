import React, { useCallback } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { ApplicationSessionStatsChart } from './ApplicationSessionStatsChart';

interface ApplicationVersionChartProps {
  applicationId: string;
}

export const ApplicationVersionChart: React.FC<ApplicationVersionChartProps> =
  React.memo((props) => {
    const { applicationId } = props;
    const { t } = useTranslation();

    const formatVersion = useCallback((version: string) => {
      return version.startsWith('v') ? version : `v${version}`;
    }, []);

    return (
      <ApplicationSessionStatsChart
        applicationId={applicationId}
        groupBy="version"
        title={t('Version Distribution')}
        formatLabel={formatVersion}
      />
    );
  });

ApplicationVersionChart.displayName = 'ApplicationVersionChart';
