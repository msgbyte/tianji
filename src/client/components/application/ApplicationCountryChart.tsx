import React, { useCallback } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { useCountryMap } from '@/utils/country';
import { ApplicationSessionStatsChart } from './ApplicationSessionStatsChart';

// Regional indicator symbols: 'US' -> 🇺🇸
function getFlagEmoji(code: string) {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))
  );
}

interface ApplicationCountryChartProps {
  applicationId: string;
}

export const ApplicationCountryChart: React.FC<ApplicationCountryChartProps> =
  React.memo((props) => {
    const { applicationId } = props;
    const { t } = useTranslation();
    const countryMap = useCountryMap();

    const formatCountry = useCallback(
      (code: string) => {
        const name = countryMap[code as keyof typeof countryMap];
        return name ? `${getFlagEmoji(code)} ${name}` : code;
      },
      [countryMap]
    );

    return (
      <ApplicationSessionStatsChart
        applicationId={applicationId}
        groupBy="country"
        title={t('Country Distribution')}
        formatLabel={formatCountry}
      />
    );
  });

ApplicationCountryChart.displayName = 'ApplicationCountryChart';
