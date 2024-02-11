import { Tag } from 'antd';
import React from 'react';
import { formatNumber } from '../../utils/common';
import { useGlobalStateStore } from '../../store/global';
import { useTranslation } from '@i18next-toolkit/react';

interface MetricCardProps {
  value?: number;
  prev?: number;
  change?: number;
  label: string;
  reverseColors?: boolean;
  format?: (n: number) => string;
  hideComparison?: boolean;
}
export const MetricCard: React.FC<MetricCardProps> = React.memo((props) => {
  const {
    value = 0,
    prev = 0,
    change = 0,
    label,
    reverseColors = false,
    format = formatNumber,
    hideComparison = false,
  } = props;
  const { t } = useTranslation();
  const showPreviousPeriod = useGlobalStateStore(
    (state) => state.showPreviousPeriod
  );

  return (
    <div className="flex flex-col justify-center min-w-[140px] min-h-[90px]">
      <div className="flex items-center whitespace-nowrap font-bold text-4xl">
        {format(value)}
      </div>
      <div className="flex items-center whitespace-nowrap font-bold">
        <span className="mr-2 capitalize">{label}</span>
        {change !== 0 && !hideComparison && (
          <Tag color={change * (reverseColors ? -1 : 1) >= 0 ? 'green' : 'red'}>
            {change > 0 && '+'}
            {format(change)}
          </Tag>
        )}
      </div>

      {showPreviousPeriod && (
        <div className="mt-2 lg:mt-4 opacity-60">
          <div className="flex items-center whitespace-nowrap font-bold text-4xl">
            {format(prev)}
          </div>
          <div className="flex items-center whitespace-nowrap font-bold">
            <span className="mr-2">{t('Previous {{label}}', { label })} </span>
          </div>
        </div>
      )}
    </div>
  );
});
MetricCard.displayName = 'MetricCard';
