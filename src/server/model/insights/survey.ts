import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { prisma } from '../_client.js';
import { printSQL } from '../../utils/prisma.js';
import { Prisma } from '@prisma/client';
import { FilterInfoType, FilterInfoValue, getDateArray } from '@tianji/shared';
import { get, uniq } from 'lodash-es';
import { env } from '../../utils/env.js';
import { InsightsSqlBuilder } from './shared.js';

export class SurveyInsightsSqlBuilder extends InsightsSqlBuilder {
  getTableName() {
    return 'SurveyResult';
  }

  buildSelectQueryArr() {
    const { metrics } = this.query;
    return metrics.map((item) => {
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

      return Prisma.empty;
    });
  }

  buildGroupSelectQueryArr() {
    const { groups } = this.query;
    let groupSelectQueryArr: Prisma.Sql[] = [];
    if (groups.length > 0) {
      for (const g of groups) {
        if (!g.customGroups) {
          groupSelectQueryArr.push(
            Prisma.sql`"SurveyResult"."payload" ->> ${g.value} as "%${Prisma.raw(g.value)}"`
          );
        } else if (g.customGroups && g.customGroups.length > 0) {
          for (const cg of g.customGroups) {
            groupSelectQueryArr.push(
              Prisma.sql`${this.buildFilterQueryOperator(
                g.value,
                g.type,
                cg.filterOperator,
                cg.filterValue
              )} as "%${Prisma.raw(`${g.value}|${cg.filterOperator}|${cg.filterValue}`)}"`
            );
          }
        }
      }
    }
    return groupSelectQueryArr;
  }

  buildWhereQueryArr() {
    const { insightId, time, filters } = this.query;
    const { startAt, endAt } = time;

    return [
      // survey id
      Prisma.sql`"SurveyResult"."surveyId" = ${insightId}`,

      // date
      this.buildDateRangeQuery('"SurveyResult"."createdAt"', startAt, endAt),

      ...filters.map((filter) =>
        this.buildFilterQueryOperator(
          filter.name,
          filter.type,
          filter.operator,
          filter.value
        )
      ),
    ];
  }

  private buildFilterQueryOperator(
    name: string,
    type: FilterInfoType,
    operator: string,
    value: FilterInfoValue | null
  ): Prisma.Sql {
    const valueField = Prisma.sql`("SurveyResult"."payload"->> ${name})${type === 'number' ? Prisma.raw('::int') : type === 'boolean' ? Prisma.raw('::boolean') : Prisma.empty}`;
    return this.buildCommonFilterQueryOperator(
      type,
      operator,
      value,
      valueField
    );
  }
}

export async function insightsSurvey(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const { time, metrics, groups } = query;
  const { startAt, endAt, unit, timezone = context.timezone } = time;

  const builder = new SurveyInsightsSqlBuilder(query, context);
  const sql = builder.build();

  if (env.isDev) {
    printSQL(sql);
  }

  const res = await prisma.$queryRaw<{ date: string | null }[]>(sql);

  let result: {
    name: string;
    [groupName: string]: any;
    data: {
      date: string;
      value: number;
    }[];
  }[] = [];

  for (const m of metrics) {
    if (groups.length > 0) {
      for (const g of groups) {
        const allGroupValue = uniq(
          res.map((item) => get(item, `%${g.value}`) as any)
        );

        result.push(
          ...allGroupValue.map((gv) => ({
            name: m.name,
            [g.value]: gv,
            data: getDateArray(
              res
                .filter((item) => get(item, `%${g.value}`) === gv)
                .map((item) => {
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
          }))
        );
      }
    } else {
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
  }

  return result;
}
