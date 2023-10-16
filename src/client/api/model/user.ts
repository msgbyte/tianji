import dayjs from 'dayjs';

/**
 * Mock
 * return local, or fetch remote data
 */
export function getUserTimezone(): string {
  return dayjs.tz.guess() ?? 'utc';
}
