import { v4, v5, validate } from 'uuid';
import crypto from 'crypto';
import { DATA_TYPE } from './const';
import { DynamicDataType } from './types';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { getWorkspaceWebsiteDateRange } from '../model/workspace';
import { isCuid } from '@paralleldrive/cuid2';
import { getMinimumUnit } from '../../shared';

export { isCuid };

dayjs.extend(minMax);

export function isUuid(value: string) {
  return validate(value);
}

export function safeDecodeURIComponent(
  s: string | string[] | undefined | null
): string | undefined | null {
  if (s === undefined || s === null) {
    return s;
  }

  if (Array.isArray(s)) {
    s = String(s);
  }

  try {
    return decodeURIComponent(s);
  } catch (e) {
    return s;
  }
}

function hash(...args: string[]) {
  return crypto.createHash('sha512').update(args.join('')).digest('hex');
}

export function hashUuid(...args: string[]) {
  if (!args.length) {
    return v4();
  }

  return v5(hash(...args), v5.DNS);
}

export function isValidDate(input: any) {
  return dayjs(input).isValid();
}

export function flattenJSON(
  eventData: { [key: string]: any },
  keyValues: {
    key: string;
    value: any;
    dynamicDataType: DynamicDataType;
  }[] = [],
  parentKey = ''
): { key: string; value: any; dynamicDataType: DynamicDataType }[] {
  return Object.keys(eventData).reduce(
    (acc, key) => {
      const value = eventData[key];
      const type = typeof eventData[key];

      // nested object
      if (
        value &&
        type === 'object' &&
        !Array.isArray(value) &&
        !isValidDate(value)
      ) {
        flattenJSON(value, acc.keyValues, getKeyName(key, parentKey));
      } else {
        createKey(getKeyName(key, parentKey), value, acc);
      }

      return acc;
    },
    { keyValues, parentKey }
  ).keyValues;
}

function getKeyName(key: string, parentKey?: string) {
  if (!parentKey) {
    return key;
  }

  return `${parentKey}.${key}`;
}

function createKey(
  key: string,
  value: any,
  acc: { keyValues: any[]; parentKey: string }
) {
  const type = getDataType(value);

  let dynamicDataType = null;

  switch (type) {
    case 'number':
      dynamicDataType = DATA_TYPE.number;
      break;
    case 'string':
      dynamicDataType = DATA_TYPE.string;
      break;
    case 'boolean':
      dynamicDataType = DATA_TYPE.boolean;
      value = value ? 'true' : 'false';
      break;
    case 'date':
      dynamicDataType = DATA_TYPE.date;
      break;
    case 'object':
      dynamicDataType = DATA_TYPE.array;
      value = JSON.stringify(value);
      break;
    default:
      dynamicDataType = DATA_TYPE.string;
      break;
  }

  acc.keyValues.push({ key, value, dynamicDataType });
}

function getDataType(value: any): string {
  let type: string = typeof value;

  if (
    (type === 'string' && isValidDate(value)) ||
    isValidDate(dayjs(value).toISOString())
  ) {
    type = 'date';
  }

  return type;
}

/**
 * Secret for auth and cacheTokenGenerate
 */
export const jwtSecret =
  process.env.JWT_SECRET || hashUuid(dayjs().format('YYYYMMDD'));

export function createToken(payload: any, secret = jwtSecret, options?: any) {
  return jwt.sign(payload, secret, options);
}

export function parseToken(token: string, secret = jwtSecret) {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

export function maxDate(...args: any[]) {
  return dayjs.max(args.filter((n) => dayjs(n).isValid()));
}

export async function parseDateRange({
  websiteId,
  startAt,
  endAt,
  unit,
}: {
  websiteId: string;
  startAt: number;
  endAt: number;
  unit?: string;
}) {
  // All-time
  if (+startAt === 0 && +endAt === 1) {
    const { min, max } = await getWorkspaceWebsiteDateRange(
      websiteId as string
    );
    const startDate = new Date(min!);
    const endDate = new Date(max!);

    return {
      startDate,
      endDate,
      unit: getMinimumUnit(startDate, endDate),
    };
  }

  const startDate = new Date(+startAt);
  const endDate = new Date(+endAt);
  const minUnit = getMinimumUnit(startDate, endDate);

  return {
    startDate,
    endDate,
    unit: (getAllowedUnits(startDate, endDate).includes(unit as string)
      ? unit
      : minUnit) as string,
  };
}

export function getAllowedUnits(startDate: Date, endDate: Date) {
  const units = ['minute', 'hour', 'day', 'month', 'year'];
  const minUnit = getMinimumUnit(startDate, endDate);
  const index = units.indexOf(minUnit);

  return index >= 0 ? units.splice(index) : [];
}

/**
 * fork from https://github.com/mcnaveen/numify/blob/main/src/index.ts
 */
export function numify(num: number): string {
  num = Number(num.toString().replace(/[^0-9.]/g, ''));
  if (num < 1000) {
    return String(num);
  }

  let si = [
    { v: 1e3, s: 'k' },
    { v: 1e6, s: 'M' },
    { v: 1e9, s: 'B' },
    { v: 1e12, s: 'T' },
    { v: 1e15, s: 'P' },
    { v: 1e18, s: 'E' },
  ];

  let index;
  for (index = si.length - 1; index > 0; index--) {
    if (num >= si[index].v) {
      break;
    }
  }
  const result: string = (
    (num / si[index].v).toFixed(2).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1') +
    si[index].s
  ).toString();

  return result;
}
