import { z } from 'zod';
import { ApplicationEvent, Prisma } from '@prisma/client';
import {
  FilterInfoType,
  getInsightGroupAlias,
  InsightPropertySource,
} from '@tianji/shared';
import { insightsQuerySchema } from '../../utils/schema.js';
import { DATA_TYPE, EVENT_TYPE } from '../../utils/const.js';
import { quoteSqlIdentifier } from '../../utils/sql.js';
import { prisma } from '../_client.js';
import { InsightEvent, InsightsSqlBuilder } from './shared.js';
import {
  insightsApplicationBuiltinFields,
  processGroupedTimeSeriesData,
} from './utils.js';
import dayjs from 'dayjs';

const { sql } = Prisma;
const metricColumn = (index: number) => `m${index}`;
const groupColumn = (index: number, bucket?: number) =>
  bucket === undefined ? `g${index}` : `g${index}_${bucket}`;

export class ApplicationInsightsSqlBuilder extends InsightsSqlBuilder {
  getTableName() {
    return 'ApplicationEvent';
  }

  protected shouldUseClickhouse(): boolean {
    // shortcut: Use PostgreSQL until ClickHouse preserves these fields and their nullability.
    const postgresFields = ['$version', '$sdkVersion', '$event', '$screenName'];
    return (
      super.shouldUseClickhouse() &&
      !this.query.filters.some(
        (f) => f.source === 'builtin' && postgresFields.includes(f.name)
      ) &&
      !this.query.groups.some(
        (g) => g.source === 'builtin' && postgresFields.includes(g.value)
      )
    );
  }

  buildSelectQueryArr() {
    return this.query.metrics.map((item, index) => {
      const alias = quoteSqlIdentifier(metricColumn(index));
      const condition =
        item.name === '$all_event'
          ? sql`1 = 1`
          : item.name === '$screen_view'
            ? sql`"ApplicationEvent"."eventType" = ${EVENT_TYPE.pageView}`
            : sql`"ApplicationEvent"."eventName" = ${item.name}`;
      if (item.math === 'events') {
        return sql`sum(case WHEN ${condition} THEN 1 ELSE 0 END) as ${alias}`;
      }
      if (item.math === 'sessions') {
        return sql`count(distinct case WHEN ${condition} THEN "ApplicationEvent"."sessionId" END) as ${alias}`;
      }
      return null;
    });
  }

  buildGroupSelectQueryArr() {
    const { groups } = this.query;
    let groupSelectQueryArr: Prisma.Sql[] = [];
    if (groups.length > 0) {
      for (const [index, g] of groups.entries()) {
        const field =
          this.getBuiltinField(g.value, g.source) ??
          sql`${quoteSqlIdentifier(`event_data_${index}`)}."value"`;
        if (!g.customGroups) {
          groupSelectQueryArr.push(
            sql`${field} as ${quoteSqlIdentifier(groupColumn(index))}`
          );
        } else if (g.customGroups && g.customGroups.length > 0) {
          for (const [bucket, cg] of g.customGroups.entries()) {
            groupSelectQueryArr.push(
              sql`${this.buildCommonFilterQueryOperator(
                g.type,
                cg.filterOperator,
                cg.filterValue,
                field
              )} as ${quoteSqlIdentifier(groupColumn(index, bucket))}`
            );
          }
        }
      }
    }
    return groupSelectQueryArr;
  }

  buildInnerJoinQuery() {
    const { filters, groups } = this.query;
    let innerJoinQuery = Prisma.empty;
    const names = [
      ...filters.filter((f) => f.source === 'builtin').map((f) => f.name),
      ...groups.filter((g) => g.source === 'builtin').map((g) => g.value),
    ];
    if (
      insightsApplicationBuiltinFields.some(
        (field) =>
          field.table === 'ApplicationSession' && names.includes(field.name)
      )
    ) {
      innerJoinQuery = sql`LEFT JOIN "ApplicationSession" ON "ApplicationEvent"."sessionId" = "ApplicationSession"."id" AND "ApplicationEvent"."applicationId" = "ApplicationSession"."applicationId"`;
    }
    for (const [index, group] of groups.entries()) {
      if (this.getBuiltinField(group.value, group.source)) continue;
      const alias = quoteSqlIdentifier(`event_data_${index}`);
      innerJoinQuery = sql`${innerJoinQuery} INNER JOIN (
          SELECT DISTINCT "applicationEventId", ${this.getValueField(group.type)} AS "value"
          FROM "ApplicationEventData"
          WHERE "applicationId" = ${this.query.insightId} AND "eventKey" = ${group.value}
        ) AS ${alias} ON "ApplicationEvent"."id" = ${alias}."applicationEventId"`;
    }

    return innerJoinQuery;
  }

  buildWhereQueryArr() {
    const { insightId, time, metrics, filters } = this.query;
    const { startAt, endAt } = time;

    const whereConditions = [
      // application id
      sql`"ApplicationEvent"."applicationId" = ${insightId}`,

      // date
      this.buildDateRangeQuery(
        '"ApplicationEvent"."createdAt"',
        startAt,
        endAt
      ),

      // event name
      Prisma.join(
        (metrics.length ? metrics : [{ name: '$all_event' }]).map((item) => {
          if (item.name === '$all_event') {
            return sql`1 = 1`;
          }

          if (item.name === '$screen_view') {
            return sql`"ApplicationEvent"."eventType" = ${EVENT_TYPE.pageView}`;
          }

          return sql`"ApplicationEvent"."eventName" = ${item.name}`;
        }),
        ' OR ',
        '(',
        ')'
      ),
      ...filters.map((filter) => {
        const builtin = this.getBuiltinField(filter.name, filter.source);
        const condition = this.buildCommonFilterQueryOperator(
          builtin ? 'string' : filter.type,
          filter.operator,
          filter.value,
          builtin ?? this.getValueField(filter.type)
        );
        return builtin
          ? condition
          : sql`"ApplicationEvent"."id" IN (
          SELECT "applicationEventId" FROM "ApplicationEventData"
          WHERE "applicationId" = ${insightId} AND "eventKey" = ${filter.name} AND ${condition}
        )`;
      }),
    ];

    return whereConditions;
  }

  /**
   * Map positional result columns back to the names
   * `processGroupedTimeSeriesData` reads.
   */
  restoreResultAliases(rows: Record<string, any>[]) {
    const { metrics, groups } = this.query;

    return rows.map((row) => {
      const restored: { date: string | null; [key: string]: any } = {
        date: row.date,
      };
      metrics.forEach((metric, index) => {
        restored[metric.alias ?? metric.name] = row[metricColumn(index)];
      });
      groups.forEach((group, index) => {
        const alias = getInsightGroupAlias(group, index);
        if (!group.customGroups) {
          restored[alias] = row[groupColumn(index)];
          return;
        }
        group.customGroups.forEach((cg, bucket) => {
          restored[`${alias}|${cg.filterOperator}|${cg.filterValue}`] =
            row[groupColumn(index, bucket)];
        });
      });

      return restored;
    });
  }

  private getBuiltinField(
    name: string,
    source?: InsightPropertySource
  ): Prisma.Sql | undefined {
    if (source !== 'builtin') return undefined;
    const field = insightsApplicationBuiltinFields.find(
      (field) => field.name === name
    );
    return field
      ? sql`${quoteSqlIdentifier(field.table)}.${quoteSqlIdentifier(field.column)}`
      : undefined;
  }

  private getValueField(type: FilterInfoType): Prisma.Sql {
    if (type === 'boolean') {
      return sql`CASE "ApplicationEventData"."stringValue"
        WHEN 'true' THEN 1 WHEN 'false' THEN 0 ELSE NULL END`;
    }

    const valueField =
      type === 'number'
        ? sql`"ApplicationEventData"."numberValue"`
        : type === 'string'
          ? sql`"ApplicationEventData"."stringValue"`
          : type === 'date'
            ? sql`"ApplicationEventData"."dateValue"`
            : sql`"ApplicationEventData"."numberValue"`;

    return valueField;
  }

  public buildFetchEventsQuery(cursor?: string): Prisma.Sql {
    const cursorCondition = cursor
      ? sql`AND ("ApplicationEvent"."createdAt", "ApplicationEvent"."id") < (
          SELECT "createdAt", "id" FROM "ApplicationEvent"
          WHERE "applicationId" = ${this.query.insightId} AND "id" = ${cursor}
        )`
      : Prisma.empty;
    return sql`SELECT "ApplicationEvent".* FROM "ApplicationEvent"
      ${this.buildInnerJoinQuery()}
      WHERE ${Prisma.join(this.buildWhereQueryArr(), ' AND ')}
      ${cursorCondition}
      ORDER BY "ApplicationEvent"."createdAt" DESC, "ApplicationEvent"."id" DESC
      LIMIT ${Math.min(this.maxResultLimit, Math.max(1, Math.floor(this.resultLimit)))}`;
  }

  public async queryEvents(cursor?: string): Promise<InsightEvent[]> {
    const events: ApplicationEvent[] = await this.executeQuery(
      this.buildFetchEventsQuery(cursor),
      () => this.buildFetchEventsQuery(cursor)
    );
    const properties = await prisma.applicationEventData.findMany({
      where: {
        applicationId: this.query.insightId,
        applicationEventId: { in: events.map((event) => event.id) },
      },
    });
    return events.map((event) => ({
      id: event.id,
      name:
        event.eventType === EVENT_TYPE.pageView
          ? 'Screen View'
          : (event.eventName ?? '<null>'),
      createdAt: dayjs.utc(event.createdAt).toDate(),
      properties: {
        ...Object.fromEntries(
          properties
            .filter((property) => property.applicationEventId === event.id)
            .map((property) => [
              property.eventKey,
              property.dataType === DATA_TYPE.number
                ? Number(property.numberValue)
                : property.dataType === DATA_TYPE.date
                  ? property.dateValue
                  : property.stringValue,
            ])
        ),
        distinctId: event.sessionId,
        sessionId: event.sessionId,
        screenName: event.screenName,
        screenParams:
          typeof event.screenParams === 'string'
            ? JSON.parse(event.screenParams || 'null')
            : event.screenParams,
      },
    }));
  }
}

export async function insightsApplication(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const builder = new ApplicationInsightsSqlBuilder(query, context);
  const data = builder.restoreResultAliases(
    await builder.executeQuery(builder.build())
  );
  return processGroupedTimeSeriesData(query, context, data);
}
