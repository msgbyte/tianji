import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { prisma } from '../_client.js';
import { getDateQuery, printSQL } from '../../utils/prisma.js';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { FilterInfoType, FilterInfoValue, getDateArray } from '@tianji/shared';
import { get, mapValues } from 'lodash-es';
import { EVENT_TYPE } from '../../utils/const.js';
import { env } from '../../utils/env.js';
import { buildCommonFilterQueryOperator } from './shared.js';

export async function insightsWebsite(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const { time, metrics } = query;
  const { startAt, endAt, unit, timezone = context.timezone } = time;

  const sql = buildInsightsWebsiteSql(query, context);

  if (env.isDev) {
    printSQL(sql);
  }

  const res = await prisma.$queryRaw<{ date: string | null }[]>(sql);

  // TODO: add group support

  let result: {
    name: string;
    [groupName: string]: any;
    data: {
      date: string;
      value: number;
    }[];
  }[] = [];

  for (const m of metrics) {
    result.push({
      name: m.name,
      data: getDateArray(
        res.map((item) => {
          return {
            value: Number(get(item, m.name)),
            date: String(item.date),
          };
        }),
        startAt,
        endAt,
        unit,
        timezone
      ),
    });
  }

  return result;
}

export function buildInsightsWebsiteSql(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
): Prisma.Sql {
  const { insightId, time, metrics, filters, groups } = query;
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

  let groupSelectQueryArr: Prisma.Sql[] = [];
  if (groups.length > 0) {
    for (const g of groups) {
      if (!g.customGroups) {
        groupSelectQueryArr.push(
          Prisma.sql`${getValueField(g.type)} as "%${Prisma.raw(g.value)}"`
        );
      } else if (g.customGroups && g.customGroups.length > 0) {
        for (const cg of g.customGroups) {
          groupSelectQueryArr.push(
            Prisma.sql`${buildFilterQueryOperator(
              g.type,
              cg.filterOperator,
              cg.filterValue
            )} as "%${Prisma.raw(`${g.value}|${cg.filterOperator}|${cg.filterValue}`)}"`
          );
        }
      }
    }
  }

  let innerJoinQuery = Prisma.empty;
  if (filters.length > 0 || groups.length > 0) {
    innerJoinQuery = Prisma.sql`INNER JOIN "WebsiteEventData" ON "WebsiteEvent"."id" = "WebsiteEventData"."websiteEventId"`;

    if (filters.length > 0) {
      innerJoinQuery = Prisma.sql`${innerJoinQuery} AND ${Prisma.join(
        filters.map((filter) =>
          buildFilterQueryOperator(filter.type, filter.operator, filter.value)
        ),
        ' AND '
      )}`;
    }

    if (groups.length > 0) {
      innerJoinQuery = Prisma.sql`${innerJoinQuery} AND ${Prisma.join(
        groups.map(
          (g) => Prisma.sql`"WebsiteEventData"."eventKey" = ${g.value}`
        ),
        ' OR '
      )}`;
    }
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

  const groupByText = Array.from({ length: groupSelectQueryArr.length + 1 })
    .map((_, i) => `${i + 1}`)
    .join(' , ');

  const sql = Prisma.sql`select
      ${getDateQuery('"WebsiteEvent"."createdAt"', unit, timezone)} date,
      ${Prisma.join([...groupSelectQueryArr, ...selectQueryArr], ' , ')}
    from "WebsiteEvent" ${innerJoinQuery}
    where ${Prisma.join(whereQueryArr, ' AND ')}
    group by ${Prisma.raw(groupByText)}`;

  return sql;
}

function getValueField(type: FilterInfoType): Prisma.Sql {
  const valueField =
    type === 'number'
      ? Prisma.sql`"WebsiteEventData"."numberValue"`
      : type === 'string'
        ? Prisma.sql`"WebsiteEventData"."stringValue"`
        : type === 'date'
          ? Prisma.sql`"WebsiteEventData"."dateValue"`
          : Prisma.sql`"WebsiteEventData"."numberValue"`;

  return valueField;
}

function buildFilterQueryOperator(
  type: FilterInfoType,
  operator: string,
  value: FilterInfoValue | null
) {
  const valueField = getValueField(type);

  return buildCommonFilterQueryOperator(type, operator, value, valueField);
}
