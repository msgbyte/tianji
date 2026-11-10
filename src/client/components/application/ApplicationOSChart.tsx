import React, { useState } from 'react';
import { Segmented } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';
import { ApplicationSessionStatsChart } from './ApplicationSessionStatsChart';

interface ApplicationOSChartProps {
  applicationId: string;
}

export const ApplicationOSChart: React.FC<ApplicationOSChartProps> = React.memo(
  (props) => {
    const { applicationId } = props;
    const { t } = useTranslation();
    const [groupBy, setGroupBy] = useState<'os' | 'osVersion'>('os');

    return (
      <ApplicationSessionStatsChart
        applicationId={applicationId}
        groupBy={groupBy}
        title={groupBy === 'os' ? t('OS Distribution') : t('OS Version')}
        header={
          <Segmented
            size="small"
            value={groupBy}
            onChange={setGroupBy}
            options={[
              { label: t('OS'), value: 'os' },
              { label: t('OS Version'), value: 'osVersion' },
            ]}
          />
        }
      />
    );
  }
);

ApplicationOSChart.displayName = 'ApplicationOSChart';
