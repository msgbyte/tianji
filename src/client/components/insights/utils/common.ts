import { FilterInfoValue } from '@tianji/shared';

/**
 * check if the value is valid for filter
 * @param value
 * @returns
 */
export function isValidFilterValue(value: FilterInfoValue) {
  if (typeof value === 'string') {
    return true;
  }

  if (typeof value === 'number') {
    return true;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return true;
    }

    return value.every(
      (item) => typeof item === 'string' || typeof item === 'number'
    );
  }

  return false;
}
