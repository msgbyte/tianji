import { z } from 'zod';
import { insightsQuerySchema } from '../../utils/schema.js';
import { prisma } from '../_client.js';
import { Prisma, WebsiteEvent } from '@prisma/client';
import {
  FilterInfoType,
  getInsightGroupAlias,
  InsightPropertySource,
} from '@tianji/shared';
import { DATA_TYPE, EVENT_TYPE } from '../../utils/const.js';
import {
  InsightEvent,
  InsightsQueryContext,
  InsightsSqlBuilder,
} from './shared.js';
import {
  insightsWebsiteBuiltinFields,
  processGroupedTimeSeriesData,
} from './utils.js';
import { clickhouse } from '../../clickhouse/index.js';
import { logger } from '../../utils/logger.js';
import { clickhouseHealthManager } from '../../clickhouse/health.js';
import { quoteSqlIdentifier } from '../../utils/sql.js';
import { TRPCError } from '@trpc/server';

const { sql } = Prisma;

// Positional aliases keep client text (metric aliases, property keys) out of
// SQL identifiers, so it can neither break quoting nor shift ClickHouse params.
const metricColumn = (index: number) => `m${index}`;
const groupColumn = (index: number, bucket?: number) =>
  bucket === undefined ? `g${index}` : `g${index}_${bucket}`;

export class WebsiteInsightsSqlBuilder extends InsightsSqlBuilder {
  constructor(
    query: z.infer<typeof insightsQuerySchema>,
    context: InsightsQueryContext,
    private readonly resetAt?: Date | null
  ) {
    super(query, context);
  }

  getTableName() {
    return 'WebsiteEvent';
  }

  protected getDistinctFieldName(): string {
    return 'distinctId';
  }

  protected buildFetchEventsSelectQuery(): Prisma.Sql {
    return sql`"WebsiteEvent".*`;
  }

  buildSelectQueryArr() {
    const { metrics } = this.query;

    return metrics.map((item, index) => {
      const alias = metricColumn(index);
      if (
        item.name === '$first_visit' &&
        (item.math === 'events' || item.math === 'sessions')
      ) {
        return sql`count(distinct case WHEN "WebsiteEvent"."eventName" is null AND "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView} AND "WebsiteEvent"."createdAt" = first_visits.first_at THEN coalesce("WebsiteEvent"."distinctId", "WebsiteEvent"."sessionId") END) as ${quoteSqlIdentifier(alias)}`;
      }

      if (item.math === 'events') {
        if (item.name === '$all_event') {
          return sql`count(1) as ${quoteSqlIdentifier(alias)}`;
        }

        if (item.name === '$page_view') {
          return sql`sum(case WHEN "WebsiteEvent"."eventName" is null AND "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView} THEN 1 ELSE 0 END) as ${quoteSqlIdentifier(alias)}`;
        }

        return sql`sum(case WHEN "WebsiteEvent"."eventName" = ${item.name} THEN 1 ELSE 0 END) as ${quoteSqlIdentifier(alias)}`;
      } else if (item.math === 'sessions') {
        const distinctId = sql`coalesce("WebsiteEvent"."distinctId", "WebsiteEvent"."sessionId")`;

        if (item.name === '$all_event') {
          return sql`count(distinct ${distinctId}) as ${quoteSqlIdentifier(alias)}`;
        }

        if (item.name === '$page_view') {
          return sql`count(distinct case WHEN "WebsiteEvent"."eventName" is null AND "WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView} THEN ${distinctId} ELSE null END) as ${quoteSqlIdentifier(alias)}`;
        }

        return sql`count(distinct case WHEN "WebsiteEvent"."eventName" = ${item.name} THEN ${distinctId} END) as ${quoteSqlIdentifier(alias)}`;
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
      insightsWebsiteBuiltinFields.some(
        (field) =>
          field.table === 'WebsiteSession' && names.includes(field.name)
      )
    ) {
      innerJoinQuery = sql`LEFT JOIN "WebsiteSession" ON "WebsiteEvent"."sessionId" = "WebsiteSession"."id" AND "WebsiteEvent"."websiteId" = "WebsiteSession"."websiteId"`;
    }
    for (const [index, group] of groups.entries()) {
      if (this.getBuiltinField(group.value, group.source)) continue;
      const alias = quoteSqlIdentifier(`event_data_${index}`);
      innerJoinQuery = sql`${innerJoinQuery} INNER JOIN (
          SELECT DISTINCT "websiteEventId", ${this.getValueField(group.type)} AS "value"
          FROM "WebsiteEventData"
          WHERE "websiteId" = ${this.query.insightId} AND "eventKey" = ${group.value}
        ) AS ${alias} ON "WebsiteEvent"."id" = ${alias}."websiteEventId"`;
    }
    if (this.query.metrics.some((item) => item.name === '$first_visit')) {
      // Find the first page view across history, independently of the query window.
      const resetFilter = this.resetAt
        ? sql`AND ${this.buildDateRangeQuery(
            '"createdAt"',
            this.resetAt.getTime(),
            this.query.time.endAt
          )}`
        : Prisma.empty;
      innerJoinQuery = sql`${innerJoinQuery}
        LEFT JOIN (
          SELECT coalesce("distinctId", "sessionId") AS visitor_id,
            min("createdAt") AS first_at
          FROM "WebsiteEvent"
          WHERE "websiteId" = ${this.query.insightId}
            AND "eventType" = ${EVENT_TYPE.pageView} AND "eventName" IS NULL
            ${resetFilter}
          GROUP BY coalesce("distinctId", "sessionId")
        ) AS first_visits ON coalesce("WebsiteEvent"."distinctId", "WebsiteEvent"."sessionId") = first_visits.visitor_id`;
    }

    return innerJoinQuery;
  }

  buildWhereQueryArr() {
    const { insightId, time, metrics, filters } = this.query;
    const { startAt, endAt } = time;

    const whereConditions = [
      // website id
      sql`"WebsiteEvent"."websiteId" = ${insightId}`,

      // date
      this.buildDateRangeQuery(
        '"WebsiteEvent"."createdAt"',
        this.resetAt ? Math.max(startAt, this.resetAt.getTime()) : startAt,
        endAt
      ),

      // event name
      Prisma.join(
        metrics.map((item) => {
          if (item.name === '$all_event') {
            return sql`1 = 1`;
          }

          if (item.name === '$page_view' || item.name === '$first_visit') {
            return sql`"WebsiteEvent"."eventType" = ${EVENT_TYPE.pageView}`;
          }

          return sql`"WebsiteEvent"."eventName" = ${item.name}`;
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
          : sql`"WebsiteEvent"."id" IN (
          SELECT "websiteEventId" FROM "WebsiteEventData"
          WHERE "websiteId" = ${insightId} AND "eventKey" = ${filter.name} AND ${condition}
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
    const field = insightsWebsiteBuiltinFields.find(
      (field) => field.name === name
    );
    return field
      ? sql`${quoteSqlIdentifier(field.table)}.${quoteSqlIdentifier(field.column)}`
      : undefined;
  }

  private getValueField(type: FilterInfoType): Prisma.Sql {
    const valueField =
      type === 'number'
        ? sql`"WebsiteEventData"."numberValue"`
        : type === 'string'
          ? sql`"WebsiteEventData"."stringValue"`
          : type === 'date'
            ? sql`"WebsiteEventData"."dateValue"`
            : sql`"WebsiteEventData"."numberValue"`;

    return valueField;
  }

  public async queryEvents(
    cursor: string | undefined
  ): Promise<InsightEvent[]> {
    const allEventsSql = this.buildFetchEventsQuery(cursor);
    const shouldUseClickhouse = this.shouldUseClickhouse();

    if (shouldUseClickhouse) {
      try {
        const result = await clickhouse.query({
          query: allEventsSql.sql,
        });
        const { data } = await result.json<any[]>();
        const allEvents = data as unknown as WebsiteEvent[];

        // Get event properties from ClickHouse
        const eventIds = allEvents.map((event) => event.id);
        if (eventIds.length > 0) {
          const eventDataResult = await clickhouse.query({
            query: `SELECT * FROM WebsiteEventData WHERE websiteEventId IN ({eventIds:Array(String)})`,
            query_params: { eventIds },
          });
          const { data: eventDataRows } = await eventDataResult.json<any[]>();
          const allEventProperties = eventDataRows;

          return this.processEventsData(allEvents, allEventProperties);
        } else {
          return this.processEventsData(allEvents, []);
        }
      } catch (error) {
        // ClickHouse query failed, fallback to PostgreSQL
        logger.warn(
          `ClickHouse queryEvents failed, falling back to PostgreSQL: ${error}`
        );

        // Trigger health check re-evaluation
        clickhouseHealthManager.forceHealthCheck().catch(() => {
          // Ignore health check failure as we're already in fallback handling
        });

        // Rebuild PostgreSQL SQL and execute
        this.useClickhouse = false;
        const pgSql = this.buildFetchEventsQuery(cursor);
        const allEvents = await prisma.$queryRaw<WebsiteEvent[]>(pgSql);

        const allEventProperties = await prisma.websiteEventData.findMany({
          where: {
            websiteEventId: {
              in: allEvents.map((event) => event.id),
            },
          },
        });

        return this.processEventsData(allEvents, allEventProperties);
      }
    } else {
      const allEvents = await prisma.$queryRaw<WebsiteEvent[]>(allEventsSql);

      const allEventProperties = await prisma.websiteEventData.findMany({
        where: {
          websiteEventId: {
            in: allEvents.map((event) => event.id),
          },
        },
      });

      return this.processEventsData(allEvents, allEventProperties);
    }
  }

  private processEventsData(
    allEvents: WebsiteEvent[],
    allEventProperties: any[]
  ): InsightEvent[] {
    const result = allEvents.map((event) => {
      const propertyRecords = allEventProperties.filter(
        (property) => property.websiteEventId === event.id
      );

      const properties = propertyRecords.reduce(
        (acc, property) => {
          if (property.dataType === DATA_TYPE.number) {
            acc[property.eventKey] = Number(property.numberValue);
          } else if (property.dataType === DATA_TYPE.date) {
            acc[property.eventKey] = property.dateValue;
          } else {
            acc[property.eventKey] = property.stringValue;
          }

          return acc;
        },
        {} as Record<string, any>
      );

      return {
        id: event.id,
        name: event.eventName ?? 'Page View',
        createdAt: event.createdAt,
        properties: {
          distinctId: event.distinctId ?? event.sessionId,
          sessionId: event.sessionId,
          urlPath: event.urlPath,
          urlQuery: event.urlQuery,
          referrerPath: event.referrerPath,
          referrerQuery: event.referrerQuery,
          referrerDomain: event.referrerDomain,
          pageTitle: event.pageTitle,
          ...properties,
        },
      };
    });

    return result;
  }
}

export async function insightsWebsite(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const website = await prisma.website.findUnique({
    where: { id: query.insightId, workspaceId: query.workspaceId },
    select: { resetAt: true },
  });
  if (!website) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Website not found' });
  }

  const builder = new WebsiteInsightsSqlBuilder(
    query,
    context,
    website.resetAt
  );
  const sql = builder.build();

  const data = builder.restoreResultAliases(await builder.executeQuery(sql));

  const result = processGroupedTimeSeriesData(query, context, data);

  return result;
}
