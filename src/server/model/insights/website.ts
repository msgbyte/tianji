import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { prisma } from '../_client.js';
import { getDateQuery } from '../../utils/prisma.js';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import {
  FilterBooleanOperator,
  FilterDateOperator,
  FilterInfoType,
  FilterInfoValue,
  FilterNumberOperator,
  FilterStringOperator,
  getDateArray,
} from '@tianji/shared';
import { get, mapValues } from 'lodash-es';
import { EVENT_TYPE } from '../../utils/const.js';
import { env } from '../../utils/env.js';
import { castToDate, castToNumber, castToString } from '../../utils/cast.js';

export async function insightsWebsite(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
): Promise<
  {
    date: string;
  }[]
> {
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

      return Prisma.sql`count(distinct case WHEN "WebsiteEvent"."eventName" = ${item.name} THEN "sessionId" ELSE 0 END) as ${Prisma.raw(`"${item.name}"`)}`;
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

  if (env.isDev) {
    console.log('insights sql:', sql.text);
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

function buildFilterQueryOperator(
  type: FilterInfoType,
  _operator: string,
  value: FilterInfoValue | null
) {
  if (type === 'number') {
    const operator = _operator as FilterNumberOperator;

    if (operator === 'equals') {
      return Prisma.sql`"WebsiteEventData"."numberValue" = ${castToNumber(value)}`;
    }
    if (operator === 'not equals') {
      return Prisma.sql`"WebsiteEventData"."numberValue" != ${castToNumber(value)}`;
    }
    if (operator === 'in list' && Array.isArray(value)) {
      return Prisma.sql`"WebsiteEventData"."numberValue" IN (${value.join(',')})`;
    }
    if (operator === 'not in list' && Array.isArray(value)) {
      return Prisma.sql`"WebsiteEventData"."numberValue" NOT IN (${value.join(',')})`;
    }
    if (operator === 'greater than') {
      return Prisma.sql`"WebsiteEventData"."numberValue" > ${castToNumber(value)}`;
    }
    if (operator === 'greater than or equal') {
      return Prisma.sql`"WebsiteEventData"."numberValue" >= ${castToNumber(value)}`;
    }
    if (operator === 'less than') {
      return Prisma.sql`"WebsiteEventData"."numberValue" < ${castToNumber(value)}`;
    }
    if (operator === 'less than or equal') {
      return Prisma.sql`"WebsiteEventData"."numberValue" <= ${castToNumber(value)}`;
    }

    if (operator === 'between') {
      return Prisma.sql`"WebsiteEventData"."numberValue" BETWEEN ${castToNumber(get(value, '0'))} AND ${castToNumber(get(value, '1'))}`;
    }
  } else if (type === 'string') {
    const operator = _operator as FilterStringOperator;

    if (operator === 'equals') {
      return Prisma.sql`"WebsiteEventData"."stringValue" = ${castToString(value)}`;
    }
    if (operator === 'not equals') {
      return Prisma.sql`"WebsiteEventData"."stringValue" != ${castToString(value)}`;
    }
    if (operator === 'contains') {
      return Prisma.sql`"WebsiteEventData"."stringValue" LIKE "%${castToString(value)}%"`;
    }
    if (operator === 'not contains') {
      return Prisma.sql`"WebsiteEventData"."stringValue" NOT LIKE "%${castToString(value)}%"`;
    }
    if (operator === 'in list' && Array.isArray(value)) {
      return Prisma.sql`"WebsiteEventData"."stringValue" IN (${value.join(',')})`;
    }
    if (operator === 'not in list' && Array.isArray(value)) {
      return Prisma.sql`"WebsiteEventData"."stringValue" NOT IN (${value.join(',')})`;
    }
  } else if (type === 'boolean') {
    const operator = _operator as FilterBooleanOperator;

    if (operator === 'equals') {
      return Prisma.sql`"WebsiteEventData"."numberValue" = ${castToNumber(value)}`;
    }
    if (operator === 'not equals') {
      return Prisma.sql`"WebsiteEventData"."numberValue" != ${castToNumber(value)}`;
    }
  } else if (type === 'date') {
    const operator = _operator as FilterDateOperator;

    if (operator === 'between') {
      return Prisma.sql`"WebsiteEventData"."dateValue" BETWEEN ${castToDate(get(value, '0'))} AND ${castToDate(get(value, '1'))}`;
    }
    if (operator === 'in day') {
      return Prisma.sql`"WebsiteEventData"."dateValue" = DATE(${castToDate(value)})`;
    }
  }

  return Prisma.sql`1 = 1`;
}
