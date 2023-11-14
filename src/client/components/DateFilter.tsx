import React, { useMemo, useState } from 'react';
import { Button, DatePicker, Dropdown, MenuProps, Modal, Space } from 'antd';
import { Dayjs } from 'dayjs';
import { DownOutlined } from '@ant-design/icons';
import { DateRange, useGlobalStateStore } from '../store/global';
import { compact } from 'lodash-es';
import clsx from 'clsx';
import { useGlobalRangeDate } from '../hooks/useGlobalRangeDate';

const { RangePicker } = DatePicker;

interface DateFilterProps {
  className?: string;
}
export const DateFilter: React.FC<DateFilterProps> = React.memo((props) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { label, startDate, endDate } = useGlobalRangeDate();
  const [range, setRange] = useState<[Dayjs, Dayjs]>([startDate, endDate]);

  const menu: MenuProps = useMemo(
    () => ({
      onClick: () => {
        setShowDropdown(false);
      },
      items: compact([
        {
          label: 'Today',
          onClick: () => {
            useGlobalStateStore.setState({ dateRange: DateRange.Today });
          },
        },
        {
          label: 'Last 24 Hours',
          onClick: () => {
            useGlobalStateStore.setState({ dateRange: DateRange.Last24Hours });
          },
        },
        {
          label: 'Yesterday',
          onClick: () => {
            useGlobalStateStore.setState({ dateRange: DateRange.Yesterday });
          },
        },
        {
          type: 'divider',
        },
        {
          label: 'This week',
          onClick: () => {
            useGlobalStateStore.setState({ dateRange: DateRange.ThisWeek });
          },
        },
        {
          label: 'Last 7 days',
          onClick: () => {
            useGlobalStateStore.setState({ dateRange: DateRange.Last7Days });
          },
        },
        {
          type: 'divider',
        },
        {
          label: 'This Month',
          onClick: () => {
            useGlobalStateStore.setState({ dateRange: DateRange.ThisMonth });
          },
        },
        {
          label: 'Last 30 days',
          onClick: () => {
            useGlobalStateStore.setState({ dateRange: DateRange.Last30Days });
          },
        },
        {
          label: 'Last 90 days',
          onClick: () => {
            useGlobalStateStore.setState({ dateRange: DateRange.Last90Days });
          },
        },
        {
          label: 'This year',
          onClick: () => {
            useGlobalStateStore.setState({ dateRange: DateRange.ThisYear });
          },
        },
        {
          type: 'divider',
        },
        {
          label: 'Custom',
          onClick: () => {
            setShowPicker(true);
          },
        },
      ] as MenuProps['items']),
    }),
    []
  );

  return (
    <>
      <Dropdown
        className={props.className}
        menu={menu}
        trigger={['click']}
        open={showDropdown}
        onOpenChange={(open) => setShowDropdown(open)}
      >
        <Button className="min-w-[150px] text-right" size="large">
          <Space>
            {label}
            <DownOutlined
              className={clsx(
                'transition-transform scale-y-75',
                showDropdown ? 'rotate-180' : 'rotate-0'
              )}
            />
          </Space>
        </Button>
      </Dropdown>

      {showPicker && (
        <Modal
          title="Select your date range"
          open={showPicker}
          onCancel={() => setShowPicker(false)}
          onOk={() => {
            useGlobalStateStore.setState({
              dateRange: DateRange.Custom,
              startDate: range[0],
              endDate: range[1],
            });
            setShowPicker(false);
          }}
        >
          <div className="text-center">
            <RangePicker
              allowEmpty={[false, false]}
              showTime={{
                format: 'HH:mm',
                showHour: true,
                showNow: true,
                showMinute: true,
                showSecond: false,
              }}
              format="YYYY-MM-DD HH:mm"
              value={range}
              onChange={(range) => {
                if (!range || !range[0] || !range[1]) {
                  return;
                }

                setRange([range[0], range[1]]);
              }}
            />
          </div>
        </Modal>
      )}
    </>
  );
});
DateFilter.displayName = 'DateFilter';
