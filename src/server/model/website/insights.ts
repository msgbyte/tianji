import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { prisma } from '../_client.js';
import { getDateQuery } from '../../utils/prisma.js';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { getDateArray } from '@tianji/shared';
import { mapValues } from 'lodash-es';
import { EVENT_TYPE } from '../../utils/const.js';

export async function insightsWebsite(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
): Promise<
  {
    date: string;
  }[]
> {
  const { websiteId, time, metrics } = query;
  const { startAt, endAt, unit, timezone = context.timezone } = time;

  const selectQueryArr = metrics.map((item) => {
    if (item.name === '$all_event') {
      return Prisma.sql`count(1) as "$all_event"`;
    }

    if (item.name === '$page_view') {
      return Prisma.sql`sum(case WHEN "WebsiteEvent"."eventName" = null AND "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView} THEN 1 ELSE 0 END) as "$page_view"`;
    }

    return Prisma.sql`sum(case WHEN "WebsiteEvent"."eventName" = ${item.name} THEN 1 ELSE 0 END) as ${Prisma.raw(`"${item.name}"`)}`;
  });

  const filterQueryArr = [
    Prisma.sql`"WebsiteEvent"."websiteId" = ${websiteId}`,
    Prisma.sql`"WebsiteEvent"."createdAt" between ${dayjs(startAt).toISOString()}::timestamptz and ${dayjs(endAt).toISOString()}::timestamptz`,

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
    from "WebsiteEvent"
    where ${Prisma.join(filterQueryArr, ' AND ')}
    group by 1`;

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
    unit
  );
}
