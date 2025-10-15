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
  if (timezone) {
    return {
      diff: (end: ConfigType, start: ConfigType) =>
        dayjs(end).tz(timezone).diff(start, unit),
      add: (date: ConfigType, n: number) =>
        dayjs(date).tz(timezone).add(n, unit),
      normalize: (date: ConfigType) => dayjs(date).tz(timezone).startOf(unit),
    };
  }

  return {
    diff: (end: ConfigType, start: ConfigType) => dayjs(end).diff(start, unit),
    add: (date: ConfigType, n: number) => dayjs(date).add(n, unit),
    normalize: (date: ConfigType) => dayjs(date).startOf(unit),
  };
}

export function formatDate(val: ConfigType, timezone?: string) {
  return timezone
    ? dayjs(val).tz(timezone).format('YYYY-MM-DD HH:mm:ss')
    : dayjs(val).format('YYYY-MM-DD HH:mm:ss');
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

  const dataMap = new Map<number, T>();
  data.forEach((item) => {
    const timestamp = timezone
      ? normalize(dayjs.tz(item.date, timezone)).valueOf()
      : normalize(dayjs(item.date)).valueOf();
    dataMap.set(timestamp, item);
  });

  for (let i = 0; i < n; i++) {
    const t = normalize(add(startDate, i));
    const target = dataMap.get(t.valueOf());

    arr.push({ ...defaultItem, ...target, date: formatDate(t, timezone) } as T);
  }

  return arr;
}

/**
 * Convert a number to a letter
 *
 * @example
 * numberToLetter(1) => 'A'
 * numberToLetter(2) => 'B'
 * numberToLetter(26) => 'Z'
 * numberToLetter(27) => 'AA'
 * numberToLetter(28) => 'AB'
 * numberToLetter(52) => 'AZ'
 * numberToLetter(53) => 'BA'
 */
export function numberToLetter(number: number) {
  if (number < 1) {
    number = 1;
  }

  let result = [];
  while (number > 0) {
    number -= 1;
    result.push(String.fromCharCode(65 + (number % 26)));
    number = Math.floor(number / 26);
  }

  return result.reverse().join('');
}
