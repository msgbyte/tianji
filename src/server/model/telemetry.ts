import { Prisma, Telemetry, TelemetrySession } from '@prisma/client';
import { Request } from 'express';
import { hashUuid } from '../utils/common';
import { getRequestInfo } from '../utils/detect';
import { prisma } from './_client';
import {
  BaseQueryFilters,
  getDateQuery,
  getTimestampIntervalQuery,
  parseTelemetryFilters,
} from '../utils/prisma';
import { SESSION_COLUMNS } from '../utils/const';

export async function recordTelemetryEvent(req: Request) {
  const { url = req.headers.referer, name, ...others } = req.query;

  if (!(url && typeof url === 'string')) {
    return;
  }
  const eventName = name ? String(name) : undefined;

  const session = await findSession(req, url);
  if (!session) {
    return;
  }

  const workspaceId = req.params.workspaceId;
  if (!workspaceId) {
    return;
  }

  const telemetryId = req.params.telemetryId;

  const { origin, pathname } = new URL(url);
  const payload = Object.keys(others).length > 0 ? others : undefined;

  await prisma.telemetryEvent.create({
    data: {
      sessionId: session.id,
      workspaceId,
      telemetryId,
      eventName,
      urlOrigin: origin,
      urlPath: pathname,
      payload,
    },
  });
}

export async function sumTelemetryEvent(req: Request): Promise<number> {
  const url = req.query.url ?? req.headers.referer;
  if (!(url && typeof url === 'string')) {
    return 0;
  }

  const eventName = req.query.name ? String(req.query.name) : undefined;

  const workspaceId = req.params.workspaceId;
  if (!workspaceId) {
    return 0;
  }

  const { origin, pathname } = new URL(url);

  const number = await prisma.telemetryEvent.count({
    where: {
      workspaceId,
      eventName,
      urlOrigin: origin,
      urlPath: pathname,
    },
  });

  return number;
}

async function findSession(req: Request, url: string) {
  const { hostname } = new URL(url);
  const workspaceId = req.params.workspaceId;
  if (!workspaceId) {
    throw new Error('Not found workspaceId');
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
  } = await getRequestInfo(req);

  const sessionId = hashUuid(workspaceId, hostname, ip, userAgent!);

  let session = await loadSession(sessionId);
  if (!session) {
    try {
      session = await prisma.telemetrySession.create({
        data: {
          id: sessionId,
          workspaceId,
          hostname,
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
        },
      });
    } catch (e: any) {
      if (!e.message.toLowerCase().includes('unique constraint')) {
        throw e;
      }
    }
  }

  return session;
}

async function loadSession(
  sessionId: string
): Promise<TelemetrySession | null> {
  const session = await prisma.telemetrySession.findUnique({
    where: {
      id: sessionId,
    },
  });

  if (!session) {
    return null;
  }

  return session;
}

export async function loadTelemetry(
  telemetryId: string
): Promise<Telemetry | null> {
  const telemetry = await prisma.telemetry.findUnique({
    where: {
      id: telemetryId,
    },
  });

  if (!telemetry || telemetry.deletedAt) {
    return null;
  }

  return telemetry;
}

export async function getTelemetryPageview(
  telemetryId: string,
  filters: BaseQueryFilters
) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { filterQuery, joinSession, params } = await parseTelemetryFilters(
    telemetryId,
    {
      ...filters,
    }
  );

  return prisma.$queryRaw`
    select
      ${getDateQuery('"TelemetryEvent"."createdAt"', unit, timezone)} x,
      count(1) y
    from "TelemetryEvent"
      ${joinSession}
    where "TelemetryEvent"."telemetryId" = ${params.telemetryId}
      and "TelemetryEvent"."createdAt" between ${
        params.startDate
      }::timestamptz and ${params.endDate}::timestamptz
      ${filterQuery}
    group by 1
  `;
}

export async function getTelemetrySession(
  telemetryId: string,
  filters: BaseQueryFilters
) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { filterQuery, joinSession, params } = await parseTelemetryFilters(
    telemetryId,
    {
      ...filters,
    }
  );

  return prisma.$queryRaw`
    select
      ${getDateQuery('"TelemetryEvent"."createdAt"', unit, timezone)} x,
      count(distinct "TelemetryEvent"."sessionId") y
    from "TelemetryEvent"
      ${joinSession}
    where "TelemetryEvent"."telemetryId" = ${params.telemetryId}
      and "TelemetryEvent"."createdAt" between ${
        params.startDate
      }::timestamptz and ${params.endDate}::timestamptz
      ${filterQuery}
    group by 1
    `;
}

export async function getTelemetryStats(
  telemetryId: string,
  filters: BaseQueryFilters
): Promise<any> {
  const { filterQuery, joinSession, params } = await parseTelemetryFilters(
    telemetryId,
    {
      ...filters,
    }
  );

  return prisma.$queryRaw`
    select
      sum(t.c) as "pageviews",
      count(distinct t."sessionId") as "uniques"
    from (
      select
        "TelemetryEvent"."sessionId",
        ${getDateQuery('"TelemetryEvent"."createdAt"', 'hour')}
      from "TelemetryEvent"
      join "Telemetry"
        on "TelemetryEvent"."telemetryId" = "Telemetry"."id"
        ${joinSession}
      where "Telemetry"."id" = ${params.telemetryId}
        and "TelemetryEvent"."createdAt" between ${
          params.startDate
        }::timestamptz and ${params.endDate}::timestamptz
        ${filterQuery}
      group by 1, 2
    ) as t
  `;
}

export async function getTelemetrySessionMetrics(
  telemetryId: string,
  column: string,
  filters: BaseQueryFilters
): Promise<{ x: string; y: number }[]> {
  const { filterQuery, joinSession, params } = await parseTelemetryFilters(
    telemetryId,
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
      count(distinct "TelemetryEvent"."sessionId") y
      ${includeCountry ? Prisma.sql([', country']) : Prisma.empty}
    from "TelemetryEvent"
    ${joinSession}
    where "TelemetryEvent"."telemetryId" = ${telemetryId}
      and "TelemetryEvent"."createdAt"
      between ${params.startDate}::timestamptz and ${
    params.endDate
  }::timestamptz
      ${filterQuery}
    group by 1
    ${includeCountry ? Prisma.sql([', 3']) : Prisma.empty}
    order by 2 desc
    limit 100`;
}

export async function getTelemetryPageviewMetrics(
  telemetryId: string,
  column: string,
  filters: BaseQueryFilters
): Promise<{ x: string; y: number }[]> {
  const { filterQuery, joinSession, params } = await parseTelemetryFilters(
    telemetryId,
    {
      ...filters,
    },
    { joinSession: SESSION_COLUMNS.includes(column) }
  );

  return prisma.$queryRaw`
    select ${Prisma.sql([`"${column}"`])}  x, count(*) y
    from "TelemetryEvent"
    ${joinSession}
    where "TelemetryEvent"."telemetryId" = ${telemetryId}
      and "TelemetryEvent"."createdAt"
      between ${params.startDate}::timestamptz and ${
    params.endDate
  }::timestamptz
      ${filterQuery}
    group by 1
    order by 2 desc
    limit 100
    `;
}
