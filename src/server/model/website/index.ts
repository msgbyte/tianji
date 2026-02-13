import { Prisma, Website, WebsiteSession } from '@prisma/client';
import {
  flattenJSON,
  hashUuid,
  isCuid,
  parseToken,
} from '../../utils/common.js';
import { prisma } from '../_client.js';
import { Request } from 'express';
import { getClientInfo } from '../../utils/detect.js';
import {
  DATA_TYPE,
  EVENT_NAME_LENGTH,
  EVENT_TYPE,
  SESSION_COLUMNS,
  URL_LENGTH,
} from '../../utils/const.js';
import type { DynamicData } from '../../utils/types.js';
import dayjs from 'dayjs';
import {
  WebsiteQueryFilters,
  getDateQuery,
  getTimestampIntervalQuery,
  parseWebsiteFilters,
  unwrapSQL,
} from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../utils/env.js';
import { clickhouse } from '../../clickhouse/index.js';
import { clickhouseHealthManager } from '../../clickhouse/health.js';
import { buildQueryWithCache } from '../../cache/index.js';
import { createBatchWriter } from '../../utils/batchWriter.js';
import { createId } from '@paralleldrive/cuid2';

interface WebsiteEventBatchItem {
  event: Prisma.WebsiteEventCreateManyInput;
  eventData?: Prisma.WebsiteEventDataCreateManyInput[];
}

const websiteEventWriter = createBatchWriter<WebsiteEventBatchItem>({
  name: 'WebsiteEvent',
  flush: async (batch) => {
    const events = batch.map((b) => b.event);
    const allEventData = batch.flatMap((b) => b.eventData ?? []);

    if (allEventData.length > 0) {
      await prisma.$transaction([
        prisma.websiteEvent.createMany({ data: events }),
        prisma.websiteEventData.createMany({ data: allEventData }),
      ]);
    } else {
      await prisma.websiteEvent.createMany({ data: events });
    }
  },
});

export interface WebsiteEventPayload {
  data?: object;
  hostname: string;
  language?: string;
  referrer?: string;
  screen?: string;
  title?: string;
  url?: string;
  website: string;
  name?: string;
}

export async function findSession(
  req: Request,
  body: any
): Promise<
  WebsiteSession & {
    workspaceId: string;
  }
> {
  // Verify payload
  const { payload } = body;

  // Check if cache token is passed
  const cacheToken = req.headers['x-tianji-cache'] as string;

  if (cacheToken) {
    const result = parseToken(cacheToken);

    if (result) {
      return result as any;
    }
  }

  const {
    website: websiteId,
    hostname,
    screen,
    language,
  } = payload as WebsiteEventPayload;

  // Check the hostname value for legality to eliminate dirty data
  const validHostnameRegex = /^[\w-.]+$/;
  if (typeof hostname === 'string' && !validHostnameRegex.test(hostname)) {
    throw new Error('Invalid hostname.');
  }

  if (!isCuid(websiteId)) {
    throw new Error('Invalid website ID.');
  }

  // Find website
  const website = await loadWebsite(websiteId);

  if (!website) {
    throw new Error(`Website not found: ${websiteId}.`);
  }

  const {
    userAgent,
    browser,
    os,
    ip,
    country,
    subdivision1,
    subdivision2,
    city,
    longitude,
    latitude,
    accuracyRadius,
    device,
  } = await getClientInfo(req, payload);

  const sessionId = hashUuid(websiteId, hostname!, ip, userAgent!);

  // Find session
  let session = await loadSession(sessionId);

  // Create a session if not found
  if (!session) {
    session = await prisma.websiteSession.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId,
        websiteId,
        hostname,
        browser,
        os,
        device,
        screen,
        language,
        ip,
        country,
        subdivision1,
        subdivision2,
        city,
        longitude,
        latitude,
        accuracyRadius,
      },
      update: {},
    });
  }

  const res: WebsiteSession & { workspaceId: string } = {
    id: sessionId,
    websiteId: session?.websiteId ?? websiteId,
    hostname: session?.hostname ?? hostname,
    browser: session?.browser ?? browser,
    os: session?.os ?? os,
    device: session?.device ?? device ?? null,
    screen: session?.screen ?? screen ?? null,
    language: session?.language ?? language ?? null,
    ip: session?.ip ?? ip,
    country: session?.country ?? country ?? null,
    subdivision1: session?.subdivision1 ?? subdivision1 ?? null,
    subdivision2: session?.subdivision2 ?? subdivision2 ?? null,
    city: session?.city ?? city ?? null,
    longitude: session?.longitude ?? longitude ?? null,
    latitude: session?.latitude ?? latitude ?? null,
    accuracyRadius: session?.accuracyRadius ?? accuracyRadius ?? null,
    createdAt: session?.createdAt ?? new Date(),
    workspaceId: website.workspaceId,
  };

  return res;
}

const { get: getWebsiteFromCache, del: delWebsiteCache } = buildQueryWithCache(
  'website',
  async (websiteId: string): Promise<Website | null> => {
    const website = await prisma.website.findUnique({
      where: {
        id: websiteId,
      },
    });

    if (!website || website.deletedAt) {
      return null;
    }

    return website;
  }
);

export async function loadWebsite(websiteId: string): Promise<Website | null> {
  return getWebsiteFromCache(websiteId);
}

export { delWebsiteCache };

const { get: getSessionFromCache, del: delWebsiteSessionCache } =
  buildQueryWithCache(
    'websiteSession',
    async (sessionId: string): Promise<WebsiteSession | null> => {
      const session = await prisma.websiteSession.findUnique({
        where: {
          id: sessionId,
        },
      });

      if (!session) {
        return null;
      }

      return session;
    }
  );

async function loadSession(sessionId: string): Promise<WebsiteSession | null> {
  return getSessionFromCache(sessionId);
}

export { delWebsiteSessionCache };

export function saveWebsiteEvent(data: {
  sessionId: string;
  websiteId: string;
  urlPath: string;
  urlQuery?: string;
  referrerPath?: string;
  referrerQuery?: string;
  referrerDomain?: string;
  pageTitle?: string;
  eventName?: string;
  eventData?: any;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}) {
  const {
    websiteId,
    sessionId,
    urlPath,
    urlQuery,
    referrerPath,
    referrerQuery,
    referrerDomain,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    eventName,
    eventData,
    pageTitle,
  } = data;

  const eventId = createId();

  const event: Prisma.WebsiteEventCreateManyInput = {
    id: eventId,
    websiteId,
    sessionId,
    urlPath: urlPath?.substring(0, URL_LENGTH),
    urlQuery: urlQuery?.substring(0, URL_LENGTH),
    referrerPath: referrerPath?.substring(0, URL_LENGTH),
    referrerQuery: referrerQuery?.substring(0, URL_LENGTH),
    referrerDomain: referrerDomain?.substring(0, URL_LENGTH),
    utmSource: utmSource?.substring(0, 100),
    utmMedium: utmMedium?.substring(0, 100),
    utmCampaign: utmCampaign?.substring(0, 100),
    utmTerm: utmTerm?.substring(0, 100),
    utmContent: utmContent?.substring(0, 100),
    pageTitle,
    eventType: eventName ? EVENT_TYPE.customEvent : EVENT_TYPE.pageView,
    eventName: eventName ? eventName?.substring(0, EVENT_NAME_LENGTH) : null,
  };

  let batchEventData: Prisma.WebsiteEventDataCreateManyInput[] | undefined;

  if (eventData) {
    const jsonKeys = flattenJSON(eventData);

    batchEventData = jsonKeys.map((a) => ({
      websiteEventId: eventId,
      websiteId,
      eventKey: a.key,
      stringValue:
        a.dynamicDataType === DATA_TYPE.number
          ? String(Number(parseFloat(a.value).toFixed(4)))
          : a.dynamicDataType === DATA_TYPE.date
            ? a.value.split('.')[0] + 'Z'
            : a.value.toString(),
      numberValue: a.dynamicDataType === DATA_TYPE.number ? a.value : null,
      dateValue:
        a.dynamicDataType === DATA_TYPE.date ? new Date(a.value) : null,
      dataType: a.dynamicDataType,
    }));
  }

  websiteEventWriter.enqueue({ event, eventData: batchEventData });
}

export async function saveWebsiteSessionData(data: {
  websiteId: string;
  sessionId: string;
  sessionData: DynamicData;
}) {
  const { websiteId, sessionId, sessionData } = data;

  const jsonKeys = flattenJSON(sessionData);

  const flattendData = jsonKeys.map(
    (a) =>
      ({
        websiteId,
        sessionId,
        key: a.key,
        stringValue:
          a.dynamicDataType === DATA_TYPE.number
            ? String(Number(parseFloat(a.value).toFixed(4)))
            : a.dynamicDataType === DATA_TYPE.date
              ? a.value.split('.')[0] + 'Z'
              : a.value.toString(),
        numberValue: a.dynamicDataType === DATA_TYPE.number ? a.value : null,
        dateValue:
          a.dynamicDataType === DATA_TYPE.date ? new Date(a.value) : null,
        dataType: a.dynamicDataType,
      }) satisfies Prisma.WebsiteSessionDataCreateManyInput
  );

  return prisma.$transaction([
    prisma.websiteSessionData.deleteMany({
      where: {
        sessionId,
      },
    }),
    prisma.websiteSessionData.createMany({
      data: flattendData,
    }),
  ]);
}

export async function getWebsiteOnlineUserCount(
  websiteId: string
): Promise<number> {
  const startAt = dayjs().subtract(5, 'minutes').toDate();

  interface Ret {
    x: number;
  }

  const res = await prisma.$queryRaw<
    Ret[]
  >`SELECT count(distinct "sessionId") x FROM "WebsiteEvent" where "websiteId" = ${websiteId} AND "createdAt" >= ${startAt}`;

  return Number(res?.[0].x ?? 0);
}

export async function getWebsiteSessionMetrics(
  websiteId: string,
  column: string,
  filters: WebsiteQueryFilters
): Promise<{ x: string; y: number }[]> {
  const { filterQuery, joinSession, params } = await parseWebsiteFilters(
    websiteId,
    {
      ...filters,
    },
    {
      joinSession: SESSION_COLUMNS.includes(column),
    }
  );
  const includeCountry = column === 'city' || column === 'subdivision1';

  if (env.clickhouse.enable && clickhouseHealthManager.isClickHouseHealthy()) {
    try {
      const chFilter = unwrapSQL(filterQuery)
        .replace(/\"WebsiteEvent\"\./g, '')
        .replace(/\"WebsiteSession\"\./g, '')
        .replace(/\"/g, '')
        .replace(/::[a-zA-Z]+/g, '');

      const chJoin =
        joinSession === Prisma.empty
          ? ''
          : 'INNER JOIN WebsiteSession ON WebsiteEvent.sessionId = WebsiteSession.id';
      const chCountrySelect = includeCountry ? ', country' : '';
      const chGroupByExtra = includeCountry ? ', country' : '';

      const chQuery = `
        select ${column} as x, uniqExact(sessionId) as y${chCountrySelect}
        from WebsiteEvent
        ${chJoin}
        where websiteId = {websiteId:String}
          and createdAt between toDateTime({start:String}, 'UTC') and toDateTime({end:String}, 'UTC')
          and eventType = {eventType:UInt64}
          ${chFilter}
        group by ${column}${chGroupByExtra}
        order by y desc
        limit 100
      `;

      const result = await clickhouse.query({
        query: chQuery,
        query_params: {
          websiteId,
          start: dayjs(params.startDate).utc().format('YYYY-MM-DD HH:mm:ss'),
          end: dayjs(params.endDate).utc().format('YYYY-MM-DD HH:mm:ss'),
          eventType: EVENT_TYPE.pageView,
        },
      });
      const json = await result.json<any>();
      const rows = (json?.data ?? []) as { x: string; y: number }[];
      return rows.map((r) => ({ x: String(r.x), y: Number(r.y) || 0 }));
    } catch (error) {
      logger.warn(
        `ClickHouse getWebsiteSessionMetrics failed, falling back to PostgreSQL: ${error}`
      );
      clickhouseHealthManager.forceHealthCheck().catch(() => {});
    }
  }

  return prisma.$queryRaw`select
      ${Prisma.sql([`"${column}"`])} x,
      count(distinct "WebsiteEvent"."sessionId") y
      ${includeCountry ? Prisma.sql([', country']) : Prisma.empty}
    from "WebsiteEvent"
    ${joinSession}
    where "WebsiteEvent"."websiteId" = ${websiteId}
      and "WebsiteEvent"."createdAt"
      between ${params.startDate}::timestamptz and ${
        params.endDate
      }::timestamptz
      and "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView}
      ${filterQuery}
    group by 1
    ${includeCountry ? Prisma.sql([', 3']) : Prisma.empty}
    order by 2 desc
    limit 100`;
}

export async function getWebsitePageviewMetrics(
  websiteId: string,
  column: string,
  filters: WebsiteQueryFilters
): Promise<{ x: string; y: number }[]> {
  const eventType =
    column === 'eventName' ? EVENT_TYPE.customEvent : EVENT_TYPE.pageView;
  const { filterQuery, joinSession, params } = await parseWebsiteFilters(
    websiteId,
    {
      ...filters,
    },
    { joinSession: SESSION_COLUMNS.includes(column) }
  );

  let excludeDomain = Prisma.empty;
  if (column === 'referrerDomain') {
    excludeDomain = Prisma.sql`and ("WebsiteEvent"."referrerDomain" != ${params.websiteDomain} or "WebsiteEvent"."referrerDomain" is null)`;
  }

  // ClickHouse fast path: only on WebsiteEvent without session join
  if (env.clickhouse.enable && clickhouseHealthManager.isClickHouseHealthy()) {
    try {
      const chFilter = unwrapSQL(filterQuery)
        .replace(/\"WebsiteEvent\"\./g, '')
        .replace(/\"WebsiteSession\"\./g, '')
        .replace(/\"/g, '')
        .replace(/::[a-zA-Z]+/g, '');

      const chExclude =
        column === 'referrerDomain'
          ? `and (referrerDomain != {websiteDomain:String} or referrerDomain is null)`
          : '';

      const chJoin =
        joinSession === Prisma.empty
          ? ''
          : 'INNER JOIN WebsiteSession ON WebsiteEvent.sessionId = WebsiteSession.id';

      const chQuery = `
        select ${column} as x, count(*) as y
        from WebsiteEvent
        ${chJoin}
        where websiteId = {websiteId:String}
          and createdAt between toDateTime({start:String}, 'UTC') and toDateTime({end:String}, 'UTC')
          and eventType = {eventType:UInt64}
          ${chExclude}
          ${chFilter}
        group by ${column}
        order by y desc
        limit 100
      `;

      const result = await clickhouse.query({
        query: chQuery,
        query_params: {
          websiteId,
          websiteDomain: params.websiteDomain,
          start: dayjs(params.startDate).utc().format('YYYY-MM-DD HH:mm:ss'),
          end: dayjs(params.endDate).utc().format('YYYY-MM-DD HH:mm:ss'),
          eventType,
        },
      });
      const json = await result.json<any>();
      const rows = (json?.data ?? []) as { x: string; y: number }[];
      return rows.map((r) => ({ x: String(r.x), y: Number(r.y) || 0 }));
    } catch (error) {
      logger.warn(
        `ClickHouse getWebsitePageviewMetrics failed, falling back to PostgreSQL: ${error}`
      );
      clickhouseHealthManager.forceHealthCheck().catch(() => {});
    }
  }

  return prisma.$queryRaw`
    select ${Prisma.sql([`"${column}"`])} x, count(*) y
    from "WebsiteEvent"
    ${joinSession}
    where "WebsiteEvent"."websiteId" = ${websiteId}
      and "WebsiteEvent"."createdAt"
      between ${params.startDate}::timestamptz and ${
        params.endDate
      }::timestamptz
      and "eventType" = ${eventType}
      ${excludeDomain}
      ${filterQuery}
    group by 1
    order by 2 desc
    limit 100
    `;
}

export async function getWorkspaceWebsitePageview(
  websiteId: string,
  filters: WebsiteQueryFilters
) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { filterQuery, joinSession, params } = await parseWebsiteFilters(
    websiteId,
    {
      ...filters,
    }
  );

  return prisma.$queryRaw<{ x: string; y: number }[]>`
    select
      ${getDateQuery('"WebsiteEvent"."createdAt"', unit, timezone)} x,
      count(1) y
    from "WebsiteEvent"
      ${joinSession}
    where "WebsiteEvent"."websiteId" = ${params.websiteId}
      and "WebsiteEvent"."createdAt" between ${
        params.startDate
      }::timestamptz and ${params.endDate}::timestamptz
      and "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView}
      ${filterQuery}
    group by 1
  `;
}

export async function getWorkspaceWebsiteSession(
  websiteId: string,
  filters: WebsiteQueryFilters
) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { filterQuery, joinSession, params } = await parseWebsiteFilters(
    websiteId,
    {
      ...filters,
    }
  );

  return prisma.$queryRaw`
    select
      ${getDateQuery('"WebsiteEvent"."createdAt"', unit, timezone)} x,
      count(distinct "WebsiteEvent"."sessionId") y
    from "WebsiteEvent"
      ${joinSession}
    where "WebsiteEvent"."websiteId" = ${params.websiteId}
      and "WebsiteEvent"."createdAt" between ${
        params.startDate
      }::timestamptz and ${params.endDate}::timestamptz
      and "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView}
      ${filterQuery}
    group by 1
    `;
}

export async function getWorkspaceWebsiteStats(
  websiteId: string,
  filters: WebsiteQueryFilters
): Promise<any> {
  const { filterQuery, joinSession, params } = await parseWebsiteFilters(
    websiteId,
    {
      ...filters,
    }
  );

  // Prefer ClickHouse when enabled and healthy; translate filterQuery for CH; require no session join
  if (
    env.clickhouse.enable &&
    clickhouseHealthManager.isClickHouseHealthy() &&
    joinSession === Prisma.empty
  ) {
    try {
      const chFilter = unwrapSQL(filterQuery)
        .replace(/\"WebsiteEvent\"\./g, '')
        .replace(/\"WebsiteSession\"\./g, '')
        .replace(/\"Website\"\./g, '')
        .replace(/\"/g, '')
        .replace(/::[a-zA-Z]+/g, '');

      const chQuery = `
        select
          sum(t.c) as pageviews,
          uniqExact(t.sessionId) as uniques,
          sum(if(t.c = 1, 1, 0)) as bounces,
          sum(t.time) as totaltime
        from (
          select
            sessionId,
            toStartOfHour(createdAt) as bucket,
            count(*) as c,
            dateDiff('second', min(createdAt), max(createdAt)) as time
          from WebsiteEvent
          where websiteId = {websiteId:String}
            and createdAt between toDateTime({start:String}, 'UTC') and toDateTime({end:String}, 'UTC')
            and eventType = {eventType:UInt64}
            ${chFilter}
          group by sessionId, bucket
        ) as t
      `;

      const result = await clickhouse.query({
        query: chQuery,
        query_params: {
          websiteId: params.websiteId,
          start: dayjs(params.startDate).utc().format('YYYY-MM-DD HH:mm:ss'),
          end: dayjs(params.endDate).utc().format('YYYY-MM-DD HH:mm:ss'),
          eventType: EVENT_TYPE.pageView,
        },
      });
      const json = await result.json<any>();
      const rows = (json?.data ?? []) as {
        pageviews: number;
        uniques: number;
        bounces: number;
        totaltime: number;
      }[];

      const row = rows?.[0] ?? {
        pageviews: 0,
        uniques: 0,
        bounces: 0,
        totaltime: 0,
      };

      // Keep the same shape as PostgreSQL: an array with one row
      return [
        {
          pageviews: Number(row.pageviews) || 0,
          uniques: Number(row.uniques) || 0,
          bounces: Number(row.bounces) || 0,
          totaltime: Number(row.totaltime) || 0,
        },
      ];
    } catch (error) {
      logger.warn(
        `ClickHouse getWorkspaceWebsiteStats failed, falling back to PostgreSQL: ${error}`
      );
      // Force health re-check; ignore error
      clickhouseHealthManager.forceHealthCheck().catch(() => {});
    }
  }

  // PostgreSQL fallback (or when extra filters are present)
  return prisma.$queryRaw`
    select
      sum(t.c) as "pageviews",
      count(distinct t."sessionId") as "uniques",
      sum(case when t.c = 1 then 1 else 0 end) as "bounces",
      sum(t.time) as "totaltime"
    from (
      select
        "WebsiteEvent"."sessionId",
        ${getDateQuery('"WebsiteEvent"."createdAt"', 'hour')},
        count(*) as c,
        ${getTimestampIntervalQuery('"WebsiteEvent"."createdAt"')} as "time"
      from "WebsiteEvent"
      join "Website"
        on "WebsiteEvent"."websiteId" = "Website"."id"
        ${joinSession}
      where "Website"."id" = ${params.websiteId}
        and "WebsiteEvent"."createdAt" between ${
          params.startDate
        }::timestamptz and ${params.endDate}::timestamptz
        and "eventType" = ${EVENT_TYPE.pageView}
        ${filterQuery}
      group by 1, 2
    ) as t
  `;
}
