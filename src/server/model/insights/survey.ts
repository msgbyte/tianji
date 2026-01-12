import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { Prisma } from '@prisma/client';
import { FilterInfoType, FilterInfoValue } from '@tianji/shared';
import { InsightEvent, InsightsSqlBuilder } from './shared.js';
import {
  insightsSurveyBuiltinFields,
  processGroupedTimeSeriesData,
} from './utils.js';
import { prisma } from '../_client.js';

const { sql, raw } = Prisma;

export class SurveyInsightsSqlBuilder extends InsightsSqlBuilder {
  getTableName() {
    return 'SurveyResult';
  }

  protected getDistinctFieldName(): string {
    return 'sessionId';
  }

  public buildFetchEventsQuery(cursor: string | undefined): Prisma.Sql {
    const tableName = this.getTableName();
    const whereQueryArr = this.buildWhereQueryArr();

    return sql`
      SELECT
        "id",
        "surveyId",
        "createdAt",
        "sessionId",
        "payload",
        "browser",
        "os",
        "language",
        "country",
        "subdivision1",
        "subdivision2",
        "city",
        "aiCategory",
        "aiTranslation"
      FROM "${raw(tableName)}"
      WHERE ${Prisma.join(whereQueryArr, ' AND ')}
      ${cursor ? sql`AND "${raw(tableName)}"."id" < ${cursor}` : Prisma.empty}
      ORDER BY "${raw(tableName)}"."createdAt" DESC
      LIMIT ${raw(String(this.resultLimit))}
    `;
  }

  buildSelectQueryArr() {
    const { metrics } = this.query;
    return metrics.map((item) => {
      const alias = item.alias ?? item.name;

      if (item.math === 'events') {
        if (item.name === '$all_event') {
          return sql`count(1) as ${raw(`"${alias}"`)}`;
        }

        if (insightsSurveyBuiltinFields.includes(item.name)) {
          return sql`sum(case WHEN "SurveyResult"."${raw(item.name)}" IS NOT NULL AND "SurveyResult"."${raw(item.name)}" <> '' THEN 1 ELSE 0 END) as ${raw(`"${alias}"`)}`;
        }

        return sql`sum(case WHEN "SurveyResult"."payload"->>'${item.name}' IS NOT NULL AND "SurveyResult"."payload"->>'${item.name}' <> '' THEN 1 ELSE 0 END) as ${raw(`"${alias}"`)}`;
      } else if (item.math === 'sessions') {
        if (item.name === '$all_event') {
          return sql`count(distinct "sessionId") as ${raw(`"${alias}"`)}`;
        }

        if (insightsSurveyBuiltinFields.includes(item.name)) {
          return sql`count(distinct case WHEN "SurveyResult"."${raw(item.name)}" IS NOT NULL AND "SurveyResult"."${raw(item.name)}" <> '' THEN "sessionId" ELSE 0 END) as ${raw(`"${alias}"`)}`;
        }

        return sql`count(distinct case WHEN "SurveyResult"."payload"->>'${item.name}' IS NOT NULL AND "SurveyResult"."payload"->>'${item.name}' <> '' THEN "sessionId" ELSE 0 END) as ${raw(`"${alias}"`)}`;
      }

      return null;
    });
  }

  buildGroupSelectQueryArr() {
    const { groups } = this.query;
    let groupSelectQueryArr: Prisma.Sql[] = [];
    if (groups.length > 0) {
      for (const g of groups) {
        if (!g.customGroups) {
          if (insightsSurveyBuiltinFields.includes(g.value)) {
            groupSelectQueryArr.push(
              sql`"SurveyResult"."${raw(g.value)}" as "%${raw(g.value)}"`
            );
          } else {
            groupSelectQueryArr.push(
              sql`"SurveyResult"."payload" ->> ${g.value} as "%${raw(g.value)}"`
            );
          }
        } else if (g.customGroups && g.customGroups.length > 0) {
          for (const cg of g.customGroups) {
            groupSelectQueryArr.push(
              sql`${this.buildFilterQueryOperator(
                g.value,
                g.type,
                cg.filterOperator,
                cg.filterValue
              )} as "%${raw(`${g.value}|${cg.filterOperator}|${cg.filterValue}`)}"`
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
      sql`"SurveyResult"."surveyId" = ${insightId}`,

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
    if (insightsSurveyBuiltinFields.includes(name)) {
      return this.buildCommonFilterQueryOperator(
        type,
        operator,
        value,
        sql`"SurveyResult"."${raw(name)}"` // this is safe because the name is defined in the `insightsSurveyBuiltinFields`
      );
    }

    const valueField = sql`("SurveyResult"."payload"->> ${name})${type === 'number' ? raw('::int') : type === 'boolean' ? raw('::boolean') : Prisma.empty}`;
    return this.buildCommonFilterQueryOperator(
      type,
      operator,
      value,
      valueField
    );
  }

  public async queryEvents(
    cursor: string | undefined
  ): Promise<InsightEvent[]> {
    const allEventsSql = this.buildFetchEventsQuery(cursor);
    const results = await prisma.$queryRaw<SurveyResultRow[]>(allEventsSql);

    return results.map((result) => ({
      id: result.id,
      name: 'survey_submit',
      createdAt: result.createdAt,
      properties: {
        ...result.payload,
        sessionId: result.sessionId,
        browser: result.browser,
        os: result.os,
        language: result.language,
        country: result.country,
        subdivision1: result.subdivision1,
        subdivision2: result.subdivision2,
        city: result.city,
        aiCategory: result.aiCategory,
        aiTranslation: result.aiTranslation,
      },
    }));
  }
}

interface SurveyResultRow {
  id: string;
  surveyId: string;
  createdAt: Date;
  sessionId: string;
  payload: Record<string, any>;
  browser: string | null;
  os: string | null;
  language: string | null;
  country: string | null;
  subdivision1: string | null;
  subdivision2: string | null;
  city: string | null;
  aiCategory: string | null;
  aiTranslation: string | null;
}

export async function insightsSurvey(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const builder = new SurveyInsightsSqlBuilder(query, {
    ...context,
    useClickhouse: false,
  });
  const sql = builder.build();

  const data = await builder.executeQuery(sql);

  const result = processGroupedTimeSeriesData(query, context, data);

  return result;
}
