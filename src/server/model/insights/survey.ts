import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { prisma } from '../_client.js';
import { getDateQuery, printSQL } from '../../utils/prisma.js';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import {
  FilterBooleanOperator,
  FilterInfoType,
  FilterInfoValue,
  FilterNumberOperator,
  FilterStringOperator,
  getDateArray,
} from '@tianji/shared';
import { mapValues } from 'lodash-es';
import { env } from '../../utils/env.js';
import { castToNumber, castToString } from '../../utils/cast.js';

export async function insightsSurvey(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
): Promise<
  {
    date: string;
  }[]
> {
  const { insightId, time, metrics, filters } = query;
  const { startAt, endAt, unit, timezone = context.timezone } = time;

  // const selectQueryArr = [Prisma.sql`count(1) as "$all_event"`];
  const selectQueryArr = metrics.map((item) => {
    if (item.math === 'events') {
      if (item.name === '$all_event') {
        return Prisma.sql`count(1) as "$all_event"`;
      }

      return Prisma.sql`sum(case WHEN "SurveyResult"."payload"->>'${item.name}' IS NOT NULL AND "SurveyResult"."payload"->>'${item.name}' <> '' THEN 1 ELSE 0 END) as ${Prisma.raw(`"${item.name}"`)}`;
    } else if (item.math === 'sessions') {
      if (item.name === '$all_event') {
        return Prisma.sql`count(distinct "sessionId") as "$all_event"`;
      }

      return Prisma.sql`count(distinct case WHEN "SurveyResult"."payload"->>'${item.name}' IS NOT NULL AND "SurveyResult"."payload"->>'${item.name}' <> '' THEN "sessionId" ELSE 0 END) as ${Prisma.raw(`"${item.name}"`)}`;
    }
  });

  let innerJoinQuery = Prisma.empty;
  if (filters.length > 0) {
    innerJoinQuery = Prisma.sql`WHERE ${Prisma.join(
      filters.map((filter) =>
        buildFilterQueryOperator(
          filter.name,
          filter.type,
          filter.operator,
          filter.value
        )
      ),
      ' AND '
    )}`;
  }

  const whereQueryArr = [
    // survey id
    Prisma.sql`"SurveyResult"."surveyId" = ${insightId}`,

    // date
    Prisma.sql`"SurveyResult"."createdAt" between ${dayjs(startAt).toISOString()}::timestamptz and ${dayjs(endAt).toISOString()}::timestamptz`,
  ];

  const sql = Prisma.sql`select
      ${getDateQuery('"SurveyResult"."createdAt"', unit, timezone)} date,
      ${Prisma.join(selectQueryArr, ' , ')}
    from "SurveyResult"
    ${innerJoinQuery}
    where ${Prisma.join(whereQueryArr, ' AND ')}
    group by 1`;

  if (env.isDev) {
    // console.log('insights sql:', sql.text, sql.values);
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

function buildFilterQueryOperator(
  name: string,
  type: FilterInfoType,
  _operator: string,
  value: FilterInfoValue | null
) {
  if (type === 'number') {
    const operator = _operator as FilterNumberOperator;

    if (operator === 'equals') {
      return Prisma.sql`("SurveyResult"."payload"->>'${name}')::int = ${castToNumber(value)}`;
    }
    if (operator === 'not equals') {
      return Prisma.sql`("SurveyResult"."payload"->>'${name}')::int != ${castToNumber(value)}`;
    }
    if (operator === 'in list' && Array.isArray(value)) {
      return Prisma.sql`("SurveyResult"."payload"->>'${name}')::int IN (${value.join(',')})`;
    }
    if (operator === 'not in list' && Array.isArray(value)) {
      return Prisma.sql`("SurveyResult"."payload"->>'${name}')::int NOT IN (${value.join(',')})`;
    }
  } else if (type === 'string') {
    const operator = _operator as FilterStringOperator;

    if (operator === 'equals') {
      return Prisma.sql`"SurveyResult"."payload"->>'${name}' = ${castToString(value)}`;
    }
    if (operator === 'not equals') {
      return Prisma.sql`"SurveyResult"."payload"->>'${name}' != ${castToString(value)}`;
    }
  } else if (type === 'boolean') {
    const operator = _operator as FilterBooleanOperator;

    if (operator === 'equals') {
      return Prisma.sql`("SurveyResult"."payload"->>'${name}')::boolean = ${value}`;
    }
    if (operator === 'not equals') {
      return Prisma.sql`("SurveyResult"."payload"->>'${name}')::boolean != ${value}`;
    }
  }

  return Prisma.sql`1 = 1`;
}
