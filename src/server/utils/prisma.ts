import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import _ from 'lodash';
import { loadWebsite } from '../model/website';
import { maxDate } from './common';
import { FILTER_COLUMNS, OPERATORS, SESSION_COLUMNS } from './const';

const POSTGRESQL_DATE_FORMATS = {
  minute: 'YYYY-MM-DD HH24:MI:00',
  hour: 'YYYY-MM-DD HH24:00:00',
  day: 'YYYY-MM-DD',
  month: 'YYYY-MM-01',
  year: 'YYYY-01-01',
};

export interface QueryFilters {
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  unit?: keyof typeof POSTGRESQL_DATE_FORMATS;
  eventType?: number;
  url?: string;
  referrer?: string;
  title?: string;
  query?: string;
  os?: string;
  browser?: string;
  device?: string;
  country?: string;
  region?: string;
  city?: string;
  language?: string;
  event?: string;
}

export interface QueryOptions {
  joinSession?: boolean;
  columns?: { [key: string]: string };
}

export async function parseFilters(
  websiteId: string,
  filters: QueryFilters = {},
  options: QueryOptions = {}
) {
  const website = await loadWebsite(websiteId);

  if (!website) {
    throw new Error('Not found website');
  }

  const websiteDomain = website.domain;

  return {
    joinSession:
      options?.joinSession ||
      Object.entries(filters).find(
        ([key, value]) =>
          typeof value !== 'undefined' && SESSION_COLUMNS.includes(key)
      )
        ? Prisma.sql([
            `inner join "WebsiteSession" on "WebsiteEvent"."sessionId" = "WebsiteSession"."id"`,
          ])
        : Prisma.empty,
    filterQuery: getFilterQuery(filters, options, websiteDomain),
    params: {
      ...normalizeFilters(filters),
      websiteId,
      startDate: dayjs(
        maxDate(filters.startDate, website.resetAt)
      ).toISOString(),
      endDate: filters.endDate
        ? dayjs(filters.endDate).toISOString()
        : undefined,
      websiteDomain,
    },
  };
}

function normalizeFilters(filters: Record<string, any> = {}) {
  return Object.keys(filters).reduce((obj, key) => {
    const value = filters[key];

    obj[key] = value?.value ?? value;

    return obj;
  }, {} as Record<string, any>);
}

export function getFilterQuery(
  filters: QueryFilters = {},
  options: QueryOptions = {},
  websiteDomain: string | null = null
) {
  const query = Object.keys(filters).reduce<string[]>((arr, name) => {
    const value: any = filters[name as keyof QueryFilters];
    const operator = value?.filter ?? OPERATORS.equals;
    const column = _.get(FILTER_COLUMNS, name, options?.columns?.[name]);

    // TODO

    if (value !== undefined && column) {
      arr.push(`AND ${mapFilter(column, operator, name)}`);

      if (name === 'referrer') {
        arr.push(
          `AND ("WebsiteEvent"."referrerDomain" != ${websiteDomain} or "WebsiteEvent"."referrerDomain" is null)`
        );
      }
    }

    return arr;
  }, []);

  return Prisma.sql([query.join('\n')]);
}

function mapFilter(
  column: string,
  operator: (typeof OPERATORS)[keyof typeof OPERATORS],
  name: string,
  type = 'varchar'
) {
  switch (operator) {
    case OPERATORS.equals:
      return `"${column}" = '${name}'::${type}`;
    case OPERATORS.notEquals:
      return `"${column}" != '${name}'::${type}`;
    default:
      return '';
  }
}

export function getDateQuery(
  field: string,
  unit: keyof typeof POSTGRESQL_DATE_FORMATS,
  timezone?: string
) {
  if (timezone) {
    return Prisma.sql([
      `to_char(date_trunc('${unit}', ${field} at time zone '${timezone}'), '${POSTGRESQL_DATE_FORMATS[unit]}')`,
    ]);
  }
  return Prisma.sql([
    `to_char(date_trunc('${unit}', ${field}), '${POSTGRESQL_DATE_FORMATS[unit]}')`,
  ]);
}
