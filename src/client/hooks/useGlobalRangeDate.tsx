import { CalendarOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useReducer } from 'react';
import { getMinimumUnit } from '../../shared';
import { DateRange, useGlobalStateStore } from '../store/global';
import { DateUnit } from '../utils/date';

export function useGlobalRangeDate(): {
  label: React.ReactNode;
  startDate: Dayjs;
  endDate: Dayjs;
  unit: DateUnit;
  refresh: () => void;
} {
  const {
    dateRange,
    startDate: globalStartDate,
    endDate: globalEndDate,
  } = useGlobalStateStore();
  const [updateInc, refresh] = useReducer((state: number) => state + 1, 0);

  const { label, startDate, endDate, unit } = useMemo(() => {
    if (dateRange === DateRange.Custom) {
      const _startDate = globalStartDate ?? dayjs().subtract(1, 'day');
      const _endDate = globalEndDate ?? dayjs();

      const isSameDate = dayjs(_startDate).isSame(_endDate, 'day');

      return {
        label: (
          <div className="flex gap-2 items-center flex-nowrap">
            <CalendarOutlined />
            <span>
              {`${dayjs(_startDate).format('YYYY-MM-DD HH:mm')} - ${dayjs(
                _endDate
              ).format(isSameDate ? 'HH:mm' : 'YYYY-MM-DD HH:mm')}`}
            </span>
          </div>
        ),
        startDate: _startDate,
        endDate: _endDate,
        unit: getMinimumUnit(_startDate, _endDate),
      };
    }

    if (dateRange === DateRange.Today) {
      return {
        label: 'Today',
        startDate: dayjs().startOf('day'),
        endDate: dayjs().endOf('day'),
        unit: 'hour' as const,
      };
    }

    if (dateRange === DateRange.Yesterday) {
      return {
        label: 'Yesterday',
        startDate: dayjs().subtract(1, 'day').startOf('day'),
        endDate: dayjs().subtract(1, 'day').endOf('day'),
        unit: 'hour' as const,
      };
    }

    if (dateRange === DateRange.ThisWeek) {
      return {
        label: 'This week',
        startDate: dayjs().startOf('week'),
        endDate: dayjs().endOf('week'),
        unit: 'day' as const,
      };
    }

    if (dateRange === DateRange.Last7Days) {
      return {
        label: 'Last 7 days',
        startDate: dayjs().subtract(7, 'day').startOf('day'),
        endDate: dayjs().endOf('day'),
        unit: 'day' as const,
      };
    }

    if (dateRange === DateRange.ThisMonth) {
      return {
        label: 'This month',
        startDate: dayjs().startOf('month'),
        endDate: dayjs().endOf('month'),
        unit: 'day' as const,
      };
    }

    if (dateRange === DateRange.Last30Days) {
      return {
        label: 'Last 30 days',
        startDate: dayjs().subtract(30, 'day').startOf('day'),
        endDate: dayjs().endOf('day'),
        unit: 'day' as const,
      };
    }

    if (dateRange === DateRange.Last90Days) {
      return {
        label: 'Last 90 days',
        startDate: dayjs().subtract(90, 'day').startOf('day'),
        endDate: dayjs().endOf('day'),
        unit: 'day' as const,
      };
    }

    if (dateRange === DateRange.ThisYear) {
      return {
        label: 'This year',
        startDate: dayjs().startOf('year'),
        endDate: dayjs().endOf('year'),
        unit: 'month' as const,
      };
    }

    // default last 24 hour
    return {
      label: 'Last 24 hours',
      startDate: dayjs().subtract(1, 'day'),
      endDate: dayjs(),
      unit: 'hour' as const,
    };
  }, [dateRange, globalStartDate, globalEndDate, updateInc]);

  return { label, startDate, endDate, unit, refresh };
}
