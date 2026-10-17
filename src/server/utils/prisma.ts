import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { loadWebsite } from '../model/website/index.js';
import { maxDate } from './common.js';
import { FILTER_COLUMNS, OPERATORS, SESSION_COLUMNS } from './const.js';
import { loadTelemetry } from '../model/telemetry.js';
import { get } from 'lodash-es';
import { assertQuotedSqlIdentifierPath } from './sql.js';

export const POSTGRESQL_DATE_FORMATS = {
  minute: 'YYYY-MM-DD HH24:MI:00',
  hour: 'YYYY-MM-DD HH24:00:00',
  day: 'YYYY-MM-DD',
  month: 'YYYY-MM-01',
  year: 'YYYY-01-01',
};

export interface QueryOptions {
  timezone?: string;
  unit?: keyof typeof POSTGRESQL_DATE_FORMATS;
}

export interface BaseQueryFilters extends QueryOptions {
  startDate?: Date;
  endDate?: Date;
  url?: string;
  country?: string;
  region?: string;
  city?: string;
}

export interface WebsiteQueryFilters extends BaseQueryFilters {
  eventType?: number;
  referrer?: string;
  title?: string;
  query?: string;
  os?: string;
  browser?: string;
  device?: string;
  language?: string;
  event?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface QueryOptions {
  joinSession?: boolean;
  columns?: { [key: string]: string };
}

export function unwrapSQL(sql: Prisma.Sql) {
  const unwrapSqlText = sql.text.replace(/\$(\d+)/g, (match, group1) => {
    const index = parseInt(group1, 10) - 1;
    return `'${sql.values[index]}'`;
  });

  return unwrapSqlText;
}

export function printSQL(sql: Prisma.Sql) {
  const unwrapSqlText = unwrapSQL(sql);

  console.log(unwrapSqlText);
}

export async function parseWebsiteFilters(
  websiteId: string,
  filters: WebsiteQueryFilters = {},
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
    filterQuery: getWebsiteFilterQuery(filters, options, websiteDomain),
    clickhouseFilter: getWebsiteClickHouseFilterQuery(
      filters,
      options,
      websiteDomain
    ),
    params: {
      ...normalizeFilters(filters),
      websiteId,
      startDate: dayjs(
        maxDate(filters.startDate, website.resetAt)
      ).toISOString(),
      endDate: filters.endDate
        ? dayjs(filters.endDate).toISOString()
        : undefined,
      resetDate: website.resetAt
        ? dayjs(website.resetAt).toISOString()
        : undefined,
      websiteDomain,
    },
  };
}

export async function parseTelemetryFilters(
  telemetryId: string,
  filters: BaseQueryFilters = {},
  options: QueryOptions = {}
) {
  const telemetry = await loadTelemetry(telemetryId);

  if (!telemetry) {
    throw new Error('Not found telemetry');
  }

  return {
    joinSession:
      options?.joinSession ||
      Object.entries(filters).find(
        ([key, value]) =>
          typeof value !== 'undefined' && SESSION_COLUMNS.includes(key)
      )
        ? Prisma.sql([
            `inner join "TelemetrySession" on "TelemetryEvent"."sessionId" = "TelemetrySession"."id"`,
          ])
        : Prisma.empty,
    filterQuery: getTelemetryFilterQuery(filters, options),
    params: {
      ...normalizeFilters(filters),
      telemetryId,
      startDate: dayjs(filters.startDate).toISOString(),
      endDate: filters.endDate
        ? dayjs(filters.endDate).toISOString()
        : undefined,
    },
  };
}

function normalizeFilters(filters: Record<string, any> = {}) {
  return Object.keys(filters).reduce(
    (obj, key) => {
      const value = filters[key];

      obj[key] = value?.value ?? value;

      return obj;
    },
    {} as Record<string, any>
  );
}

export function getWebsiteFilterQuery(
  filters: WebsiteQueryFilters = {},
  options: QueryOptions = {},
  websiteDomain: string | null = null
) {
  const query = Object.keys(filters).reduce<Prisma.Sql[]>((arr, name) => {
    const value: any = filters[name as keyof WebsiteQueryFilters];
    const operator = value?.filter ?? OPERATORS.equals;
    const column = get(FILTER_COLUMNS, name, options?.columns?.[name]);

    if (value !== undefined && column) {
      arr.push(mapFilter(column, operator, value?.value ?? value));

      if (name === 'referrer' && websiteDomain) {
        arr.push(
          Prisma.sql`AND ("WebsiteEvent"."referrerDomain" != ${websiteDomain} or "WebsiteEvent"."referrerDomain" is null)`
        );
      }
    }

    return arr;
  }, []);

  return query.length > 0 ? Prisma.join(query, '\n') : Prisma.empty;
}

/**
 * Same filters as getWebsiteFilterQuery, for the ClickHouse queries.
 * Values are passed as query params, never inlined into the SQL text.
 */
export function getWebsiteClickHouseFilterQuery(
  filters: WebsiteQueryFilters = {},
  options: QueryOptions = {},
  websiteDomain: string | null = null
) {
  const params: Record<string, string> = {};
  const query: string[] = [];

  Object.keys(filters).forEach((name) => {
    const value: any = filters[name as keyof WebsiteQueryFilters];
    const operator = value?.filter ?? OPERATORS.equals;
    const column = get(FILTER_COLUMNS, name, options?.columns?.[name]);
    const sqlOperator = SQL_OPERATORS[operator];

    if (value === undefined || !column || !sqlOperator) {
      return;
    }

    assertQuotedSqlIdentifierPath(`"${column}"`);

    const param = `filter_${query.length}`;
    params[param] = String(value?.value ?? value);
    query.push(`AND ${column} ${sqlOperator} {${param}:String}`);

    if (name === 'referrer' && websiteDomain) {
      params.filter_websiteDomain = websiteDomain;
      query.push(
        'AND (referrerDomain != {filter_websiteDomain:String} or referrerDomain is null)'
      );
    }
  });

  return { sql: query.join('\n'), params };
}

export function getTelemetryFilterQuery(
  filters: BaseQueryFilters = {},
  options: QueryOptions = {}
) {
  const query = Object.keys(filters).reduce<Prisma.Sql[]>((arr, name) => {
    const value: any = filters[name as keyof BaseQueryFilters];
    const operator = value?.filter ?? OPERATORS.equals;
    const column = get(FILTER_COLUMNS, name, options?.columns?.[name]);

    if (value !== undefined && column) {
      arr.push(mapFilter(column, operator, value?.value ?? value));
    }

    return arr;
  }, []);

  return query.length > 0 ? Prisma.join(query, '\n') : Prisma.empty;
}

const SQL_OPERATORS: Record<string, string> = {
  [OPERATORS.equals]: '=',
  [OPERATORS.notEquals]: '!=',
};

function mapFilter(
  column: string,
  operator: (typeof OPERATORS)[keyof typeof OPERATORS],
  value: unknown
) {
  const sqlOperator = SQL_OPERATORS[operator];

  if (!sqlOperator) {
    return Prisma.empty;
  }

  const identifier = Prisma.raw(assertQuotedSqlIdentifierPath(`"${column}"`));

  return Prisma.sql`AND ${identifier} ${Prisma.raw(sqlOperator)} ${String(value)}::varchar`;
}

export function getDateQuery(
  field: string,
  unit: keyof typeof POSTGRESQL_DATE_FORMATS,
  timezone?: string
) {
  if (!(unit in POSTGRESQL_DATE_FORMATS)) {
    throw new Error(`Invalid date unit: ${unit}`);
  }

  const safeField = Prisma.raw(assertQuotedSqlIdentifierPath(field));
  const format = POSTGRESQL_DATE_FORMATS[unit];

  if (timezone) {
    return Prisma.sql`to_char(date_trunc(${unit}, ${safeField} at time zone ${timezone}), ${format})`;
  }
  return Prisma.sql`to_char(date_trunc(${unit}, ${safeField}), ${format})`;
}

export function getTimestampIntervalQuery(field: string) {
  return Prisma.sql([
    `floor(extract(epoch from max(${field}) - min(${field})))`,
  ]);
}

type ExtractFindManyReturnType<T> = T extends (
  args?: any
) => Prisma.PrismaPromise<infer R>
  ? R
  : never;

type ExtractFindManyWhereType<
  T extends {
    findMany: (args?: any) => Prisma.PrismaPromise<any>;
  },
> = NonNullable<Parameters<T['findMany']>[0]>['where'];

type ExtractFindManySelectType<
  T extends {
    findMany: (args?: any) => Prisma.PrismaPromise<any>;
  },
> = NonNullable<Parameters<T['findMany']>[0]>['select'];

/**
 * @example
 * const { items, nextCursor } = await fetchDataByCursor(
 *   prisma.workspaceAuditLog,
 *   {
 *     where: {
 *       workspaceId,
 *     },
 *     limit,
 *     cursor,
 *   }
 * );
 */
export async function fetchDataByCursor<
  Model extends {
    findMany: (args?: any) => Prisma.PrismaPromise<any>;
  },
  CursorType,
>(
  fetchModel: Model,
  options: {
    // where: Record<string, any>;
    where: ExtractFindManyWhereType<Model>;
    select?: ExtractFindManySelectType<Model>;
    limit: number;
    cursor: CursorType;
    cursorName?: string;
    order?: 'asc' | 'desc';
  }
) {
  const {
    where,
    limit,
    cursor,
    select,
    cursorName = 'id',
    order = 'desc',
  } = options;
  const items: ExtractFindManyReturnType<Model['findMany']> =
    await fetchModel.findMany({
      where,
      select,
      take: limit + 1,
      cursor: cursor
        ? {
            [cursorName]: cursor,
          }
        : undefined,
      orderBy: {
        [cursorName]: order,
      },
    });

  let nextCursor: CursorType | undefined = undefined;
  if (items.length > limit) {
    const nextItem = items.pop()!;
    nextCursor = nextItem[cursorName];
  }

  return {
    items,
    nextCursor,
  };
}
