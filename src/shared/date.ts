import dayjs, { ConfigType } from 'dayjs';

export function getMinimumUnit(startDate: ConfigType, endDate: ConfigType) {
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
