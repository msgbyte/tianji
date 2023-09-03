import { v4, v5, validate } from 'uuid';
import crypto from 'crypto';
import { DATA_TYPE } from './const';
import { DynamicDataType } from './types';
import dayjs from 'dayjs';

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
