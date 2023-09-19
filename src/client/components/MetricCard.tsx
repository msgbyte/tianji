import { Tag } from 'antd';
import React from 'react';
import { formatNumber } from '../utils/common';

interface MetricCardProps {
  value?: number;
  change?: number;
  label: string;
  reverseColors?: boolean;
  format?: (n: number) => string;
  hideComparison?: boolean;
}
export const MetricCard: React.FC<MetricCardProps> = React.memo((props) => {
  const {
    value = 0,
    change = 0,
    label,
    reverseColors = false,
    format = formatNumber,
    hideComparison = false,
  } = props;

  return (
    <div className="flex flex-col justify-center min-w-[140px] min-h-[90px]">
      <div className="flex items-center whitespace-nowrap font-bold text-4xl">
        {format(value)}
      </div>
      <div className="flex items-center whitespace-nowrap font-bold">
        <span className="mr-2">{label}</span>
        {~~change !== 0 && !hideComparison && (
          <Tag color={change * (reverseColors ? -1 : 1) >= 0 ? 'green' : 'red'}>
            {change > 0 && '+'}
            {format(change)}
          </Tag>
        )}
      </div>
    </div>
  );
});
MetricCard.displayName = 'MetricCard';
