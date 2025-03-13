import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { prisma } from '../_client.js';
import { getDateQuery, printSQL } from '../../utils/prisma.js';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { FilterInfoType, FilterInfoValue, getDateArray } from '@tianji/shared';
import { mapValues } from 'lodash-es';
import { EVENT_TYPE } from '../../utils/const.js';
import { env } from '../../utils/env.js';
import { buildCommonFilterQueryOperator } from './shared.js';

export async function insightsWebsite(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
): Promise<
  {
    date: string;
  }[]
> {
  const { time } = query;
  const { startAt, endAt, unit, timezone = context.timezone } = time;

  const sql = buildInsightsWebsiteSql(query, context);

  if (env.isDev) {
    printSQL(sql);
  }

  const res = await prisma.$queryRaw<{ date: string | null }[]>(sql);

  return getDateArray(
    res.map((item) => {
      return {
        ...mapValues(item, (val) => Number(val)),
        date: String(item.date),
      };
    }),
    startAt,
    endAt,
    unit,
    timezone
  );
}

export function buildInsightsWebsiteSql(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
): Prisma.Sql {
  const { insightId, time, metrics, filters } = query;
  const { startAt, endAt, unit, timezone = context.timezone } = time;

  const selectQueryArr = metrics.map((item) => {
    if (item.math === 'events') {
      if (item.name === '$all_event') {
        return Prisma.sql`count(1) as "$all_event"`;
      }

      if (item.name === '$page_view') {
        return Prisma.sql`sum(case WHEN "WebsiteEvent"."eventName" is null AND "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView} THEN 1 ELSE 0 END) as "$page_view"`;
      }

      return Prisma.sql`sum(case WHEN "WebsiteEvent"."eventName" = ${item.name} THEN 1 ELSE 0 END) as ${Prisma.raw(`"${item.name}"`)}`;
    } else if (item.math === 'sessions') {
      if (item.name === '$all_event') {
        return Prisma.sql`count(distinct "sessionId") as "$all_event"`;
      }

      if (item.name === '$page_view') {
        return Prisma.sql`count(distinct case WHEN "WebsiteEvent"."eventName" is null AND "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView} THEN "sessionId" ELSE null END) as "$page_view"`;
      }

      return Prisma.sql`count(distinct case WHEN "WebsiteEvent"."eventName" = ${item.name} THEN "sessionId" END) as ${Prisma.raw(`"${item.name}"`)}`;
    }
  });

  let innerJoinQuery = Prisma.empty;
  if (filters.length > 0) {
    innerJoinQuery = Prisma.sql`INNER JOIN "WebsiteEventData" ON "WebsiteEvent"."id" = "WebsiteEventData"."websiteEventId" AND ${Prisma.join(
      filters.map((filter) =>
        buildFilterQueryOperator(filter.type, filter.operator, filter.value)
      ),
      ' AND '
    )}`;
  }

  const whereQueryArr = [
    // website id
    Prisma.sql`"WebsiteEvent"."websiteId" = ${insightId}`,

    // date
    Prisma.sql`"WebsiteEvent"."createdAt" between ${dayjs(startAt).toISOString()}::timestamptz and ${dayjs(endAt).toISOString()}::timestamptz`,

    // event name
    Prisma.join(
      metrics.map((item) => {
        if (item.name === '$all_event') {
          return Prisma.sql`1 = 1`;
        }

        if (item.name === '$page_view') {
          return Prisma.sql`"WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView}`;
        }

        return Prisma.sql`"WebsiteEvent"."eventName" = ${item.name}`;
      }),
      ' OR ',
      '(',
      ')'
    ),
  ];

  const sql = Prisma.sql`select
      ${getDateQuery('"WebsiteEvent"."createdAt"', unit, timezone)} date,
      ${Prisma.join(selectQueryArr, ' , ')}
    from "WebsiteEvent" ${innerJoinQuery}
    where ${Prisma.join(whereQueryArr, ' AND ')}
    group by 1`;

  return sql;
}

function buildFilterQueryOperator(
  type: FilterInfoType,
  operator: string,
  value: FilterInfoValue | null
) {
  const valueField =
    type === 'number'
      ? Prisma.sql`"WebsiteEventData"."numberValue"`
      : type === 'string'
        ? Prisma.sql`"WebsiteEventData"."stringValue"`
        : type === 'date'
          ? Prisma.sql`"WebsiteEventData"."dateValue"`
          : Prisma.sql`"WebsiteEventData"."numberValue"`;

  return buildCommonFilterQueryOperator(type, operator, value, valueField);
}
