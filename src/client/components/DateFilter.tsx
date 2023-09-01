import React from 'react';
import { Select } from 'antd';
import { compact } from 'lodash-es';

export const DateFilter: React.FC<{
  showAllTime?: boolean;
}> = React.memo((props) => {
  const options = compact([
    { label: 'Today', value: '1day' },
    {
      label: 'Last 24 hours',
      value: '24hour',
    },
    {
      label: 'Yesterday',
      value: '-1day',
    },
    {
      label: 'This Week',
      value: '1week',
    },
    {
      label: 'Last 7 days',
      value: '7day',
    },
    {
      label: 'This Month',
      value: '1month',
    },
    {
      label: 'Last 30 days',
      value: '30day',
    },
    {
      label: 'Last 90 days',
      value: '90day',
    },
    { label: 'This year', value: '1year' },
    props.showAllTime === true && {
      label: 'All time',
      value: 'all',
    },
    {
      label: 'Custom range',
      value: 'custom',
    },
  ]);

  return (
    <div>
      <Select
        className="min-w-[10rem]"
        size="large"
        options={options}
        defaultValue="24hour"
      />
    </div>
  );
});
DateFilter.displayName = 'DateFilter';
