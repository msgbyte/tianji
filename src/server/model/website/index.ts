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
} from '../../utils/prisma.js';

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

export async function findSession(req: Request): Promise<
  WebsiteSession & {
    workspaceId: string;
  }
> {
  // Verify payload
  const { payload } = req.body;

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
    try {
      session = await prisma.websiteSession.create({
        data: {
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
      });
    } catch (e: any) {
      if (!e.message.toLowerCase().includes('unique constraint')) {
        throw e;
      }
    }
  }

  const res: any = { ...session!, workspaceId: website.workspaceId };

  return res;
}

export async function loadWebsite(websiteId: string): Promise<Website | null> {
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

async function loadSession(sessionId: string): Promise<WebsiteSession | null> {
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

export async function saveWebsiteEvent(data: {
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
}) {
  const {
    websiteId,
    sessionId,
    urlPath,
    urlQuery,
    referrerPath,
    referrerQuery,
    referrerDomain,
    eventName,
    eventData,
    pageTitle,
  } = data;

  const websiteEvent = await prisma.websiteEvent.create({
    data: {
      websiteId,
      sessionId,
      urlPath: urlPath?.substring(0, URL_LENGTH),
      urlQuery: urlQuery?.substring(0, URL_LENGTH),
      referrerPath: referrerPath?.substring(0, URL_LENGTH),
      referrerQuery: referrerQuery?.substring(0, URL_LENGTH),
      referrerDomain: referrerDomain?.substring(0, URL_LENGTH),
      pageTitle,
      eventType: eventName ? EVENT_TYPE.customEvent : EVENT_TYPE.pageView,
      eventName: eventName ? eventName?.substring(0, EVENT_NAME_LENGTH) : null,
    },
  });

  if (eventData) {
    const jsonKeys = flattenJSON(eventData);

    // id, websiteEventId, eventStringValue
    const flattendData = jsonKeys.map((a) => ({
      websiteEventId: websiteEvent.id,
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

    await prisma.websiteEventData.createMany({
      data: flattendData,
    });
  }

  return websiteEvent;
}

export async function saveWebsiteSessionData(data: {
  websiteId: string;
  sessionId: string;
  sessionData: DynamicData;
}) {
  const { websiteId, sessionId, sessionData } = data;

  const jsonKeys = flattenJSON(sessionData);

  const flattendData = jsonKeys.map((a) => ({
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
    dateValue: a.dynamicDataType === DATA_TYPE.date ? new Date(a.value) : null,
    dataType: a.dynamicDataType,
  }));

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

  return prisma.$queryRaw`
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
