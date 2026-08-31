import { Prisma, Website, WebsiteSession } from '@prisma/client';
import {
  flattenJSON,
  hashUuid,
  isCuid,
  isUuid,
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
import { promWebsiteSessionErrorCounter } from '../../utils/prometheus/client.js';

export interface WebsiteEventBatchItem {
  event: Prisma.WebsiteEventCreateManyInput;
  eventData?: Prisma.WebsiteEventDataCreateManyInput[];
}

export class WebsiteNotFoundError extends Error {
  constructor(public readonly websiteId: string) {
    super(`Website not found: ${websiteId}.`);
    this.name = 'WebsiteNotFoundError';
  }
}

async function filterBatchByExistingSessions(batch: WebsiteEventBatchItem[]) {
  const sessionIds = [...new Set(batch.map((b) => b.event.sessionId))];
  const sessions = await prisma.websiteSession.findMany({
    where: {
      id: {
        in: sessionIds,
      },
    },
    select: {
      id: true,
    },
  });
  const existingSessionIds = new Set(sessions.map((session) => session.id));
  const filteredBatch = batch.filter((b) =>
    existingSessionIds.has(b.event.sessionId)
  );
  const droppedBatch = batch.filter(
    (b) => !existingSessionIds.has(b.event.sessionId)
  );
  const droppedCount = batch.length - filteredBatch.length;

  if (droppedCount > 0) {
    const websiteIds = [...new Set(droppedBatch.map((b) => b.event.websiteId))];
    const droppedSessionIds = [
      ...new Set(droppedBatch.map((b) => b.event.sessionId)),
    ];

    logger.warn(
      `[WebsiteEvent] Dropped ${droppedCount} item(s) because their sessions no longer exist.`,
      {
        websiteIds,
        sessionIds: droppedSessionIds.slice(0, 10),
        sessionIdCount: droppedSessionIds.length,
      }
    );
  }

  return filteredBatch;
}

async function writeWebsiteEventBatch(batch: WebsiteEventBatchItem[]) {
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
}

function isPrismaErrorCode(err: unknown, code: string) {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === code
  );
}

export async function persistWebsiteEventBatch(
  batch: WebsiteEventBatchItem[]
) {
  const filteredBatch = await filterBatchByExistingSessions(batch);

  if (filteredBatch.length === 0) {
    return;
  }

  try {
    await writeWebsiteEventBatch(filteredBatch);
  } catch (err) {
    if (!isPrismaErrorCode(err, 'P2003')) {
      throw err;
    }

    const retryBatch = await filterBatchByExistingSessions(filteredBatch);

    if (retryBatch.length === 0) {
      return;
    }

    await writeWebsiteEventBatch(retryBatch);
  }
}

const websiteEventWriter = createBatchWriter<WebsiteEventBatchItem>({
  name: 'WebsiteEvent',
  flush: persistWebsiteEventBatch,
});

export interface WebsiteEventPayload {
  data?: object;
  distinctId?: string;
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
    throw new WebsiteNotFoundError(websiteId);
  }

  // Check if cache token is passed. The token only skips client/session
  // detection when it still belongs to this website and the session exists.
  const cacheToken = req.headers['x-tianji-cache'] as string;

  if (cacheToken) {
    const result = parseToken(cacheToken);

    if (
      result &&
      typeof result === 'object' &&
      'id' in result &&
      'websiteId' in result &&
      typeof result.id === 'string' &&
      typeof result.websiteId === 'string' &&
      isUuid(result.id) &&
      result.websiteId === websiteId
    ) {
      const session = await loadLiveSession(result.id);

      if (session && session.websiteId === websiteId) {
        await updateWebsiteSessionCache(result.id)(session);

        return {
          ...session,
          workspaceId: website.workspaceId,
        };
      }

      if (!session) {
        await delWebsiteSessionCache(result.id);
      }
    }
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
  let session = await loadLiveSession(sessionId);

  // Create a session if not found
  if (!session) {
    try {
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
    } catch (err) {
      if (
        (err as Prisma.PrismaClientKnownRequestError).code === 'P2002'
      ) {
        promWebsiteSessionErrorCounter.inc({
          type: 'p2002',
          endpoint: 'session_upsert',
        });
        session = await prisma.websiteSession.findUnique({
          where: { id: sessionId },
        });
      }
      if (!session) throw err;
    }
  }

  await updateWebsiteSessionCache(sessionId)(session);

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

async function loadLiveSession(
  sessionId: string
): Promise<WebsiteSession | null> {
  return prisma.websiteSession.findUnique({
    where: {
      id: sessionId,
    },
  });
}

const { del: delWebsiteSessionCache, update: updateWebsiteSessionCache } =
  buildQueryWithCache(
    'websiteSession',
    async (sessionId: string): Promise<WebsiteSession | null> => {
      const session = await loadLiveSession(sessionId);

      if (!session) {
        return null;
      }

      return session;
    }
  );

export { delWebsiteSessionCache };

export function saveWebsiteEvent(data: {
  sessionId: string;
  distinctId?: string;
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
    distinctId,
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
    distinctId: distinctId ?? sessionId,
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
  >`SELECT count(distinct coalesce("distinctId", "sessionId")) x FROM "WebsiteEvent" where "websiteId" = ${websiteId} AND "createdAt" >= ${startAt}`;

  return Number(res?.[0].x ?? 0);
}

export async function getWorkspaceWebsiteVisitorCounts(
  workspaceId: string,
  startAt: Date
): Promise<Record<string, number>> {
  const websiteIds = (
    await prisma.website.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
      },
    })
  ).map((website) => website.id);

  if (websiteIds.length === 0) {
    return {};
  }

  if (clickhouseHealthManager.isClickHouseHealthy()) {
    try {
      const result = await clickhouse.query({
        query: `
          select
            websiteId,
            uniqExact(coalesce(distinctId, sessionId)) as visitorCount
          from WebsiteEvent
          where websiteId in {websiteIds:Array(String)}
            and eventType = {eventType:UInt64}
            and eventName is null
            and createdAt >= toDateTime({startAt:String}, 'UTC')
          group by websiteId
        `,
        query_params: {
          websiteIds,
          eventType: EVENT_TYPE.pageView,
          startAt: dayjs(startAt).utc().format('YYYY-MM-DD HH:mm:ss'),
        },
      });
      const { data } = await result.json<{
        websiteId: string;
        visitorCount: string;
      }>();

      return data.reduce<Record<string, number>>((prev, item) => {
        prev[item.websiteId] = Number(item.visitorCount);
        return prev;
      }, {});
    } catch (error) {
      logger.warn(
        `ClickHouse getWorkspaceWebsiteVisitorCounts failed, falling back to PostgreSQL: ${error}`
      );
      clickhouseHealthManager.forceHealthCheck().catch(() => {});
    }
  }

  const res = await prisma.$queryRaw<
    { websiteId: string; visitorCount: bigint }[]
  >`
    select
      "WebsiteEvent"."websiteId",
      count(distinct coalesce("WebsiteEvent"."distinctId", "WebsiteEvent"."sessionId")) as "visitorCount"
    from "WebsiteEvent"
    join "Website"
      on "WebsiteEvent"."websiteId" = "Website"."id"
    where "Website"."workspaceId" = ${workspaceId}
      and "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView}
      and "WebsiteEvent"."eventName" is null
      and "WebsiteEvent"."createdAt" >= ${startAt}
    group by "WebsiteEvent"."websiteId"
  `;

  return res.reduce<Record<string, number>>((prev, item) => {
    if (item.websiteId) {
      prev[item.websiteId] = Number(item.visitorCount);
    }

    return prev;
  }, {});
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
        select ${column} as x, uniqExact(coalesce(distinctId, sessionId)) as y${chCountrySelect}
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
      count(distinct coalesce("WebsiteEvent"."distinctId", "WebsiteEvent"."sessionId")) y
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
      count(distinct coalesce("WebsiteEvent"."distinctId", "WebsiteEvent"."sessionId")) y
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

export async function getWorkspaceWebsiteRetention(
  websiteId: string,
  filters: WebsiteQueryFilters
) {
  const { timezone = 'UTC' } = filters;
  const { params } = await parseWebsiteFilters(websiteId, filters);
  type RetentionQueryRow = {
    date: string;
    cohortSize: number | string;
    [key: string]: number | string | null;
  };
  const normalizeRows = (rows: RetentionQueryRow[]) =>
    rows.map((row) => {
      const cohortSize = Number(row.cohortSize);

      return {
        date: String(row.date),
        cohortSize,
        retention: [
          cohortSize,
          ...Array.from({ length: 30 }, (_, index) => {
            const value = row[`d${index + 1}`];
            return value === null || value === undefined ? null : Number(value);
          }),
        ],
      };
    });
  const retentionColumns = Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    return `
      if(
        addDays(cohorts.cohort_date, ${day}) < toDate(now(), {timezone:String}),
        uniqExactIf(activity.session_id, activity.activity_date = addDays(cohorts.cohort_date, ${day})),
        null
      ) d${day}`;
  }).join(',');

  if (clickhouseHealthManager.isClickHouseHealthy()) {
    try {
      const result = await clickhouse.query({
        query: `
          with cohorts as (
            select
              coalesce(distinctId, sessionId) session_id,
              toDate(min(createdAt), {timezone:String}) cohort_date
            from WebsiteEvent
            where websiteId = {websiteId:String}
              ${
                params.resetDate
                  ? `and createdAt >= toDateTime64({resetAt:String}, 3, 'UTC')`
                  : ''
              }
              and createdAt <= toDateTime64({endAt:String}, 3, 'UTC')
              and eventType = {eventType:UInt8}
            group by coalesce(distinctId, sessionId)
            having min(createdAt) between
              toDateTime64({startAt:String}, 3, 'UTC') and
              toDateTime64({endAt:String}, 3, 'UTC')
          ), activity as (
            select distinct
              coalesce(distinctId, sessionId) session_id,
              toDate(createdAt, {timezone:String}) activity_date
            from WebsiteEvent
            where websiteId = {websiteId:String}
              and createdAt >= toDateTime64({startAt:String}, 3, 'UTC')
              and createdAt < least(
                addDays(toDateTime64({endAt:String}, 3, 'UTC'), 32),
                now64(3)
              )
              and eventType = {eventType:UInt8}
          )
          select
            formatDateTime(cohorts.cohort_date, '%F') date,
            uniqExact(cohorts.session_id) cohortSize,
            ${retentionColumns}
          from cohorts
          left join activity on activity.session_id = cohorts.session_id
          group by cohorts.cohort_date
          order by cohorts.cohort_date desc
        `,
        query_params: {
          websiteId: params.websiteId,
          startAt: dayjs(params.startDate)
            .utc()
            .format('YYYY-MM-DD HH:mm:ss.SSS'),
          endAt: dayjs(params.endDate).utc().format('YYYY-MM-DD HH:mm:ss.SSS'),
          ...(params.resetDate
            ? {
                resetAt: dayjs(params.resetDate)
                  .utc()
                  .format('YYYY-MM-DD HH:mm:ss.SSS'),
              }
            : {}),
          eventType: EVENT_TYPE.pageView,
          timezone,
        },
      });
      const { data } = await result.json<RetentionQueryRow>();

      return normalizeRows(data ?? []);
    } catch (error) {
      logger.warn(
        `ClickHouse getWorkspaceWebsiteRetention failed, falling back to PostgreSQL: ${error}`
      );
      clickhouseHealthManager.forceHealthCheck().catch(() => {});
    }
  }

  const postgresRetentionColumns = Prisma.join(
    Array.from({ length: 30 }, (_, index) => {
      const day = index + 1;
      return Prisma.sql`
        case when cohorts.cohort_date + ${day}::integer < (current_timestamp at time zone ${timezone})::date
          then count(distinct activity.session_id) filter (where activity.activity_date = cohorts.cohort_date + ${day}::integer)::integer
        end ${Prisma.raw(`d${day}`)}`;
    })
  );
  const rows = await prisma.$queryRaw<RetentionQueryRow[]>`
    with cohorts as (
      select
        coalesce("distinctId", "sessionId") session_id,
        (min("createdAt") at time zone ${timezone})::date cohort_date
      from "WebsiteEvent"
      where "websiteId" = ${params.websiteId}
        ${
          params.resetDate
            ? Prisma.sql`and "createdAt" >= ${params.resetDate}::timestamptz`
            : Prisma.empty
        }
        and "createdAt" <= ${params.endDate}::timestamptz
        and "eventType" = ${EVENT_TYPE.pageView}
      group by coalesce("distinctId", "sessionId")
      having min("createdAt") between ${params.startDate}::timestamptz and ${params.endDate}::timestamptz
    ), activity as (
      select distinct
        coalesce("distinctId", "sessionId") session_id,
        ("createdAt" at time zone ${timezone})::date activity_date
      from "WebsiteEvent"
      where "websiteId" = ${params.websiteId}
        and "createdAt" >= ${params.startDate}::timestamptz
        and "createdAt" < least(
          ((((${params.endDate}::timestamptz at time zone ${timezone})::date + 31)::timestamp) at time zone ${timezone}),
          current_timestamp
        )
        and "eventType" = ${EVENT_TYPE.pageView}
    )
    select
      to_char(cohorts.cohort_date, 'YYYY-MM-DD') date,
      count(distinct cohorts.session_id)::integer "cohortSize",
      ${postgresRetentionColumns}
    from cohorts
    left join activity on activity.session_id = cohorts.session_id
    group by cohorts.cohort_date
    order by cohorts.cohort_date desc
  `;

  return normalizeRows(rows);
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
        with filtered_events as (
          select
            sessionId,
            coalesce(distinctId, sessionId) as distinctId,
            createdAt
          from WebsiteEvent
          where websiteId = {websiteId:String}
            and createdAt between toDateTime({start:String}, 'UTC') and toDateTime({end:String}, 'UTC')
            and eventType = {eventType:UInt64}
            ${chFilter}
        ), stats as (
          select
            sessionId,
            toStartOfHour(createdAt) as bucket,
            count(*) as c,
            dateDiff('second', min(createdAt), max(createdAt)) as time
          from filtered_events
          group by sessionId, bucket
        )
        select
          sum(stats.c) as pageviews,
          (select uniqExact(distinctId) from filtered_events) as uniques,
          sum(if(stats.c = 1, 1, 0)) as bounces,
          sum(stats.time) as totaltime
        from stats
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
    with filtered_events as (
      select
        "WebsiteEvent"."sessionId",
        coalesce("WebsiteEvent"."distinctId", "WebsiteEvent"."sessionId") as "distinctId",
        "WebsiteEvent"."createdAt"
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
    ), stats as (
      select
        "sessionId",
        ${getDateQuery('"createdAt"', 'hour')},
        count(*) as c,
        ${getTimestampIntervalQuery('"createdAt"')} as "time"
      from filtered_events
      group by 1, 2
    )
    select
      sum(stats.c) as "pageviews",
      (select count(distinct "distinctId") from filtered_events) as "uniques",
      sum(case when stats.c = 1 then 1 else 0 end) as "bounces",
      sum(stats.time) as "totaltime"
    from stats
  `;
}
