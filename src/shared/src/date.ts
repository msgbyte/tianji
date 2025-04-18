import dayjs, { ConfigType } from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export type DateUnit = 'minute' | 'hour' | 'day' | 'month' | 'year';

export function getMinimumUnit(
  startDate: ConfigType,
  endDate: ConfigType
): DateUnit {
  if (dayjs(endDate).diff(startDate, 'minutes') <= 60) {
    return 'minute';
  } else if (dayjs(endDate).diff(startDate, 'hours') <= 48) {
    return 'hour';
  } else if (dayjs(endDate).diff(startDate, 'days') <= 90) {
    return 'day';
  } else if (dayjs(endDate).diff(startDate, 'months') <= 24) {
    return 'month';
  }

  return 'year';
}

function createDateUnitFn(unit: DateUnit, timezone?: string) {
  return {
    diff: (end: ConfigType, start: ConfigType) =>
      dayjs(end).tz(timezone).diff(start, unit),
    add: (date: ConfigType, n: number) => dayjs(date).tz(timezone).add(n, unit),
    normalize: (date: ConfigType) => dayjs(date).tz(timezone).startOf(unit),
  };
}

export function formatDate(val: ConfigType, timezone?: string) {
  return dayjs(val).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * generate a date array from start to end date
 * @param timezone - If not provided, timezone will not be processed, otherwise the output date will be converted to the corresponding timezone
 */
export function getDateArray<T extends { date: string }>(
  data: T[],
  startDate: ConfigType,
  endDate: ConfigType,
  unit: DateUnit,
  timezone?: string
): T[] {
  if (data.length === 0) {
    return [];
  }

  const defaultItem: Omit<T, 'date'> = Object.keys(data[0]).reduce(
    (acc: any, key) => {
      if (key === 'date') {
        return acc;
      }

      acc[key] = 0;

      return acc;
    },
    {}
  );

  const arr: T[] = [];
  const { diff, add, normalize } = createDateUnitFn(unit, timezone);
  const n = diff(endDate, startDate) + 1;

  function findData(date: dayjs.Dayjs) {
    const target = data.find((item) => {
      return normalize(dayjs(item.date)).unix() === date.unix();
    });

    return { ...defaultItem, ...target };
  }

  for (let i = 0; i < n; i++) {
    const t = normalize(add(startDate, i));
    const item = findData(t);

    arr.push({ ...item, date: formatDate(t, timezone) } as T);
  }

  return arr;
}
