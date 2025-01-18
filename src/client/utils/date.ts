import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import type { DateUnit } from '@tianji/shared';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

export type { DateUnit };

function createDateUnitFn(unit: DateUnit) {
  return {
    diff: (end: dayjs.ConfigType, start: dayjs.ConfigType) =>
      dayjs(end).diff(start, unit),
    add: (date: dayjs.ConfigType, n: number) => dayjs(date).add(n, unit),
    normalize: (date: dayjs.ConfigType) => dayjs(date).startOf(unit),
  };
}

/**
 * @deprecated
 * replace with `@tianji/shared`
 */
export function getDateArray(
  data: { x: string; y: number }[],
  startDate: dayjs.ConfigType,
  endDate: dayjs.ConfigType,
  unit: DateUnit
) {
  const arr = [];
  const { diff, add, normalize } = createDateUnitFn(unit);
  const n = diff(endDate, startDate) + 1;

  function findData(date: dayjs.Dayjs) {
    const d = data.find(({ x }) => {
      return normalize(dayjs(x)).unix() === date.unix();
    });

    return d?.y || 0;
  }

  for (let i = 0; i < n; i++) {
    const t = normalize(add(startDate, i));
    const y = findData(t);

    arr.push({ x: formatDate(t), y });
  }

  return arr;
}

export function formatDate(val: dayjs.ConfigType) {
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDateWithUnit(val: dayjs.ConfigType, unit: DateUnit) {
  if (unit === 'minute') {
    return dayjs(val).format('HH:mm');
  } else if (unit === 'hour') {
    return dayjs(val).format('HA');
  } else if (unit === 'day') {
    return dayjs(val).format('MMM DD');
  } else if (unit === 'month') {
    return dayjs(val).format('MMM');
  } else if (unit === 'year') {
    return dayjs(val).format('YYYY');
  }

  return formatDate(val);
}

function formatOffset(offset: number) {
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const minutes = String(absOffset % 60).padStart(2, '0');

  return `${sign}${hours}:${minutes}`;
}

export function getTimezoneList() {
  const timezones = Intl.supportedValuesOf('timeZone');

  return timezones.map((timezone) => {
    const offset = dayjs().tz(timezone).utcOffset();

    return {
      label: `${timezone} (${formatOffset(offset)})`,
      value: timezone,
    };
  });
}

export function getShortTextByUnit(date: dayjs.ConfigType, dateUnit: DateUnit) {
  if (dateUnit === 'minute') {
    return dayjs(date).format('HH:mm');
  }

  if (dateUnit === 'hour') {
    return dayjs(date).format('MMM D, ha');
  }

  if (dateUnit === 'day') {
    return dayjs(date).format('MMM D');
  }

  if (dateUnit === 'month') {
    return dayjs(date).format('MMM YYYY');
  }

  if (dateUnit === 'year') {
    return dayjs(date).format('YYYY');
  }

  return dayjs(date, 'YYYY-MM-DD HH:mm:ss');
}
