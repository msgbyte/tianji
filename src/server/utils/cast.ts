import dayjs from 'dayjs';

export function castToNumber(value: unknown): number {
  return Number(value) || 0;
}

export function castToString(value: unknown): string {
  return String(value ?? '');
}

export function castToDate(value: unknown): Date {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    value instanceof Date
  ) {
    return dayjs(value).toDate();
  } else {
    return new Date();
  }
}
