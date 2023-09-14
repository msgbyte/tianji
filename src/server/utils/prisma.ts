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

  return {
    joinSession:
      options?.joinSession ||
      Object.keys(filters).find((key) => SESSION_COLUMNS.includes(key))
        ? `inner join session on website_event.session_id = session.session_id`
        : '',
    filterQuery: getFilterQuery(filters, options),
    params: {
      ...normalizeFilters(filters),
      websiteId,
      startDate: maxDate(filters.startDate, website.resetAt),
      websiteDomain: website.domain,
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
  options: QueryOptions = {}
): string {
  const query = Object.keys(filters).reduce<string[]>((arr, name) => {
    const value: any = filters[name as keyof QueryFilters];
    const operator = value?.filter ?? OPERATORS.equals;
    const column = _.get(FILTER_COLUMNS, name, options?.columns?.[name]);

    if (value !== undefined && column) {
      arr.push(`and ${mapFilter(column, operator, name)}`);

      if (name === 'referrer') {
        arr.push(
          'and (website_event.referrer_domain != {{websiteDomain}} or website_event.referrer_domain is null)'
        );
      }
    }

    return arr;
  }, []);

  return query.join('\n');
}

function mapFilter(
  column: string,
  operator: (typeof OPERATORS)[keyof typeof OPERATORS],
  name: string,
  type = 'varchar'
) {
  switch (operator) {
    case OPERATORS.equals:
      return `${column} = {{${name}::${type}}}`;
    case OPERATORS.notEquals:
      return `${column} != {{${name}::${type}}}`;
    default:
      return '';
  }
}

export function getDateQuery(
  field: string,
  unit: keyof typeof POSTGRESQL_DATE_FORMATS,
  timezone?: string
): string {
  if (timezone) {
    return `to_char(date_trunc('${unit}', ${field} at time zone '${timezone}'), '${POSTGRESQL_DATE_FORMATS[unit]}')`;
  }
  return `to_char(date_trunc('${unit}', ${field}), '${POSTGRESQL_DATE_FORMATS[unit]}')`;
}
