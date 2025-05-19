import { Serialize } from '../types/utils.js';

/**
 * serialize object
 * make data easy to transfer
 */
export function serializeJSON<T extends {}>(input: T): Serialize<T> {
  return serializeDate(input) as Serialize<T>;
}

type ConvertDateToString<T> = T extends Date
  ? string
  : T extends Date | null
    ? string | null
    : T extends Date | undefined
      ? string | undefined
      : T extends Date | null | undefined
        ? string | null | undefined
        : T;

export type DateToString<T> = {
  [P in keyof T]: T[P] extends Date | null | undefined
    ? ConvertDateToString<T[P]>
    : DateToString<T[P]>;
};

function serializeDate<T extends {}>(obj: T): DateToString<T> {
  function stripDates(_obj: unknown): any {
    if (!_obj || typeof _obj !== 'object') {
      return _obj;
    }

    if (_obj === null) {
      return null;
    }

    if (_obj instanceof Date) {
      return _obj.toISOString();
    }

    if (Array.isArray(_obj)) {
      return _obj.map(stripDates);
    }

    return Object.keys(_obj).reduce(
      (acc, key) => {
        const value = (_obj as any)[key];
        acc[key] = stripDates(value); // Recursive to handle nested objects
        return acc;
      },
      {} as { [key: string]: any }
    );
  }

  return stripDates(obj);
}
