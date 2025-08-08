/**
 * Custom Warehouse for Insights
 */

import { Prisma } from '@prisma/client';
import { InsightsSqlBuilder } from '../shared.js';
import { insightsQuerySchema } from '../../../utils/schema.js';
import { z } from 'zod';
import dayjs from 'dayjs';
import { processGroupedTimeSeriesData } from '../utils.js';
import { FilterInfoType, FilterInfoValue } from '@tianji/shared';
import { compact, get } from 'lodash-es';
import {
  dateTypeSchema,
  getWarehouseApplications,
  getWarehouseConnection,
  MYSQL_DATE_FORMATS,
  WarehouseInsightsApplication,
} from './utils.js';

export class WarehouseLongTableInsightsSqlBuilder extends InsightsSqlBuilder {
  getApplication(): WarehouseInsightsApplication {
    const name = this.query.insightId;

    const application = getWarehouseApplications().find(
      (app) => app.name === name
    );

    if (!application) {
      throw new Error(`Application ${name} not found`);
    }

    return application;
  }

  private enableDateBasedOptimizedEventTable() {
    const eventTable = this.getEventTable();
    const startAt = this.query.time.startAt;
    const endAt = this.query.time.endAt;

    return (
      !!eventTable.dateBasedCreatedAtField &&
      dayjs(endAt).diff(startAt, 'day') >= 1
    );
  }

  private getEventTable() {
    return this.getApplication().eventTable;
  }

  private getEventParametersTable() {
    return this.getApplication().eventParametersTable;
  }

  getTableName() {
    return this.getEventTable().name;
  }

  private getValueField(type: FilterInfoType): Prisma.Sql {
    const eventParametersTable = this.getEventParametersTable();

    const valueField =
      type === 'number'
        ? Prisma.sql`"${Prisma.raw(eventParametersTable.name)}"."${Prisma.raw(eventParametersTable.paramsValueNumberField ?? eventParametersTable.paramsValueField)}"`
        : type === 'string'
          ? Prisma.sql`"${Prisma.raw(eventParametersTable.name)}"."${Prisma.raw(eventParametersTable.paramsValueStringField ?? eventParametersTable.paramsValueField)}"`
          : type === 'date'
            ? Prisma.sql`"${Prisma.raw(eventParametersTable.name)}"."${Prisma.raw(eventParametersTable.paramsValueDateField ?? eventParametersTable.paramsValueField)}"`
            : Prisma.sql`"${Prisma.raw(eventParametersTable.name)}"."${Prisma.raw(eventParametersTable.paramsValueField)}"`;

    return valueField;
  }

  private buildFilterQueryOperator(
    type: FilterInfoType,
    operator: string,
    value: FilterInfoValue | null
  ) {
    const valueField = this.getValueField(type);

    return this.buildCommonFilterQueryOperator(
      type,
      operator,
      value,
      valueField
    );
  }

  protected getDateQuery(
    field: string,
    unit: string,
    timezone: string,
    type: z.infer<typeof dateTypeSchema> = 'timestampMs'
  ): Prisma.Sql {
    // Check if unit exists in MYSQL_DATE_FORMATS before using it
    if (!(unit in MYSQL_DATE_FORMATS)) {
      throw new Error(`Invalid date unit: ${unit}`);
    }

    const format = MYSQL_DATE_FORMATS[unit as keyof typeof MYSQL_DATE_FORMATS];
    let timeExpression: Prisma.Sql;

    switch (type) {
      case 'timestamp':
        // Unix timestamp in seconds - convert to datetime first
        timeExpression = Prisma.sql`FROM_UNIXTIME(${Prisma.raw(field)})`;
        break;
      case 'timestampMs':
        // Unix timestamp in milliseconds - convert to seconds first, then to datetime
        timeExpression = Prisma.sql`FROM_UNIXTIME(${Prisma.raw(field)} / 1000)`;
        break;
      case 'date':
        // Date string format (YYYY-MM-DD) - convert to datetime
        timeExpression = Prisma.sql`STR_TO_DATE(${Prisma.raw(field)}, '%Y-%m-%d')`;
        break;
      case 'datetime':
        // Datetime string format (YYYY-MM-DD HH:MM:SS) - use directly
        timeExpression = Prisma.sql`STR_TO_DATE(${Prisma.raw(field)}, '%Y-%m-%d %H:%i:%s')`;
        break;
      default:
        // Default to timestampMs for backwards compatibility
        timeExpression = Prisma.sql`FROM_UNIXTIME(${Prisma.raw(field)} / 1000)`;
        break;
    }

    return Prisma.sql`DATE_FORMAT(CONVERT_TZ(${timeExpression}, '+00:00', ${timezone}), '${Prisma.raw(format)}')`;
  }

  protected buildOptimizedDateRangeQuery(): Prisma.Sql {
    const { time } = this.query;
    const { startAt, endAt } = time;

    const eventTable = this.getEventTable();
    const enableDateBasedOptimizedEventTable =
      this.enableDateBasedOptimizedEventTable();
    const type = eventTable.createdAtFieldType;

    let startTime = String(dayjs(startAt).valueOf());
    let endTime = String(dayjs(endAt).valueOf());

    let field = enableDateBasedOptimizedEventTable
      ? `"${eventTable.name}"."${eventTable.dateBasedCreatedAtField ?? eventTable.createdAtField}"`
      : `"${eventTable.name}"."${eventTable.createdAtField}"`;

    if (this.enableDateBasedOptimizedEventTable()) {
      // if enable date based optimized event table,
      // and the date range is more than 1 day,
      // we need to use the date based created at field
      startTime = String(dayjs(startAt).startOf('day').format('YYYY-MM-DD'));
      endTime = String(dayjs(endAt).endOf('day').format('YYYY-MM-DD'));
    } else {
      if (type === 'timestamp') {
        // Unix timestamp in seconds
        startTime = String(dayjs(startAt).unix());
        endTime = String(dayjs(endAt).unix());
      }
      if (type === 'date') {
        // Date string format (YYYY-MM-DD)
        startTime = dayjs(startAt).startOf('day').format('YYYY-MM-DD');
        endTime = dayjs(endAt).endOf('day').format('YYYY-MM-DD');
      }
      if (type === 'datetime') {
        // Datetime string format (YYYY-MM-DD HH:mm:ss)
        startTime = dayjs(startAt).utc().format('YYYY-MM-DD HH:mm:ss');
        endTime = dayjs(endAt).utc().format('YYYY-MM-DD HH:mm:ss');
      }
    }

    return Prisma.sql`${Prisma.raw(field)} BETWEEN ${startTime} AND ${endTime}`;
  }

  protected getOptimizedDateQuery(): Prisma.Sql {
    const { time } = this.query;
    const { unit, timezone = 'UTC' } = time;
    const eventTable = this.getEventTable();
    const enableDateBasedOptimizedEventTable =
      this.enableDateBasedOptimizedEventTable();
    const type = enableDateBasedOptimizedEventTable
      ? eventTable.dateBasedCreatedAtField
        ? 'date'
        : eventTable.createdAtFieldType
      : eventTable.createdAtFieldType;
    const field = enableDateBasedOptimizedEventTable
      ? `"${eventTable.name}"."${eventTable.dateBasedCreatedAtField ?? eventTable.createdAtField}"`
      : `"${eventTable.name}"."${eventTable.createdAtField}"`;

    // Check if unit exists in MYSQL_DATE_FORMATS before using it
    if (!(unit in MYSQL_DATE_FORMATS)) {
      throw new Error(`Invalid date unit: ${unit}`);
    }

    const format = MYSQL_DATE_FORMATS[unit as keyof typeof MYSQL_DATE_FORMATS];
    let timeExpression: Prisma.Sql;

    switch (type) {
      case 'timestamp':
        // Unix timestamp in seconds - convert to datetime first
        timeExpression = Prisma.sql`FROM_UNIXTIME(${Prisma.raw(field)})`;
        break;
      case 'timestampMs':
        // Unix timestamp in milliseconds - convert to seconds first, then to datetime
        timeExpression = Prisma.sql`FROM_UNIXTIME(${Prisma.raw(field)} / 1000)`;
        break;
      case 'date':
        // Date string format (YYYY-MM-DD) - convert to datetime
        timeExpression = Prisma.sql`STR_TO_DATE(${Prisma.raw(field)}, '%Y-%m-%d')`;
        break;
      case 'datetime':
        // Datetime string format (YYYY-MM-DD HH:MM:SS) - use directly
        timeExpression = Prisma.sql`STR_TO_DATE(${Prisma.raw(field)}, '%Y-%m-%d %H:%i:%s')`;
        break;
      default:
        // Default to timestampMs for backwards compatibility
        timeExpression = Prisma.sql`FROM_UNIXTIME(${Prisma.raw(field)} / 1000)`;
        break;
    }

    return Prisma.sql`DATE_FORMAT(CONVERT_TZ(${timeExpression}, '+00:00', ${timezone}), '${Prisma.raw(format)}')`;
  }

  protected buildOptimizedDateQuerySql(): Prisma.Sql {
    const { time } = this.query;
    const { unit, timezone = 'UTC' } = time;
    const eventTable = this.getEventTable();

    if (
      this.enableDateBasedOptimizedEventTable() &&
      eventTable.dateBasedCreatedAtField
    ) {
      const field = `"${eventTable.name}"."${eventTable.dateBasedCreatedAtField}"`;
      const format =
        MYSQL_DATE_FORMATS[unit as keyof typeof MYSQL_DATE_FORMATS];

      return Prisma.sql`DATE_FORMAT(${Prisma.raw(field)}, '${Prisma.raw(format)}') date`;
    } else {
      return Prisma.sql`${this.getDateQuery(
        `"${eventTable.name}"."${eventTable.createdAtField}"`,
        unit,
        timezone,
        eventTable.createdAtFieldType
      )} date`;
    }
  }

  protected buildDateQuerySql(): Prisma.Sql {
    return this.buildOptimizedDateQuerySql();
  }

  buildSelectQueryArr() {
    const { metrics } = this.query;
    const eventTable = this.getEventTable();

    return metrics.map((item) => {
      if (item.math === 'events') {
        if (item.name === '$all_event') {
          return Prisma.sql`count(1) as "$all_event"`;
        }

        return Prisma.sql`sum(case WHEN "${Prisma.raw(eventTable.name)}"."${Prisma.raw(eventTable.eventNameField)}" = ${item.name} THEN 1 ELSE 0 END) as ${Prisma.raw(`"${item.name}"`)}`;
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
          groupSelectQueryArr.push(
            Prisma.sql`${this.getValueField(g.type)} as "%${Prisma.raw(g.value)}"`
          );
        } else if (g.customGroups && g.customGroups.length > 0) {
          for (const cg of g.customGroups) {
            groupSelectQueryArr.push(
              Prisma.sql`${this.buildFilterQueryOperator(
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

  buildInnerJoinQuery() {
    const { filters, groups } = this.query;
    const eventTable = this.getEventTable();
    const eventParametersTable = this.getEventParametersTable();

    let innerJoinQuery = Prisma.empty;
    if (filters.length > 0 || groups.length > 0) {
      innerJoinQuery = Prisma.sql`INNER JOIN "${Prisma.raw(eventParametersTable.name)}" ON "${Prisma.raw(eventTable.name)}"."${Prisma.raw(eventTable.eventNameField)}" = "${Prisma.raw(eventParametersTable.name)}"."${Prisma.raw(eventParametersTable.eventNameField)}"`;

      if (filters.length > 0) {
        innerJoinQuery = Prisma.sql`${innerJoinQuery} AND ${Prisma.join(
          filters.map((filter) =>
            this.buildFilterQueryOperator(
              filter.type,
              filter.operator,
              filter.value
            )
          ),
          ' AND '
        )}`;
      }

      if (groups.length > 0) {
        const groupConditions = groups.map(
          (g) =>
            Prisma.sql`"${Prisma.raw(eventParametersTable.name)}"."${Prisma.raw(eventParametersTable.eventNameField)}" = ${g.value}`
        );
        innerJoinQuery = Prisma.sql`${innerJoinQuery} AND ${Prisma.join(
          groupConditions,
          ' OR '
        )}`;
      }
    }

    return innerJoinQuery;
  }

  buildWhereQueryArr() {
    const { metrics } = this.query;
    const eventTable = this.getEventTable();

    const whereConditions = [
      // date
      this.buildOptimizedDateRangeQuery(),

      // event name
      Prisma.join(
        metrics.map((item) => {
          if (item.name === '$all_event') {
            return Prisma.sql`1 = 1`;
          }

          return Prisma.sql`"${Prisma.raw(eventTable.name)}"."${Prisma.raw(eventTable.eventNameField)}" = ${item.name}`;
        }),
        ' OR ',
        '(',
        ')'
      ),
    ];

    return whereConditions;
  }

  async executeQuery(sql: Prisma.Sql): Promise<any[]> {
    const connection = getWarehouseConnection();

    const [rows] = await connection.query(
      sql.sql.replaceAll('"', '`'), // avoid mysql and pg sql syntax error about double quote
      sql.values
    );

    return rows as any[];
  }
}

export async function insightsWarehouse(
  query: z.infer<typeof insightsQuerySchema>,
  context: { timezone: string }
) {
  const builder = new WarehouseLongTableInsightsSqlBuilder(query, context);
  const sql = builder.build();

  const data = await builder.executeQuery(sql);

  const result = processGroupedTimeSeriesData(query, context, data);

  return result;
}

export async function insightsWarehouseEvents(
  applicationId: string
): Promise<string[]> {
  const connection = getWarehouseConnection();
  const eventTable = getWarehouseApplications().find(
    (app) => app.name === applicationId
  )?.eventTable;

  if (!eventTable) {
    throw new Error(`Event table not found for application ${applicationId}`);
  }

  const [rows] = await connection.query(`
SELECT DISTINCT event_name
FROM (
    SELECT \`${eventTable.eventNameField}\` as event_name, \`${eventTable.dateBasedCreatedAtField ?? eventTable.createdAtField}\` as date
    FROM \`${eventTable.name}\`
    ORDER BY \`${eventTable.dateBasedCreatedAtField ?? eventTable.createdAtField}\` DESC
) t
LIMIT 100;`);

  if (!Array.isArray(rows)) {
    throw new Error(`Invalid rows from warehouse`);
  }

  return compact(rows.map((row) => get(row, 'event_name', '')));
}

export async function insightsWarehouseFilterParams(
  applicationId: string
): Promise<string[]> {
  const connection = getWarehouseConnection();
  const eventParametersTable = getWarehouseApplications().find(
    (app) => app.name === applicationId
  )?.eventParametersTable;

  if (!eventParametersTable) {
    throw new Error(`Event table not found for application ${applicationId}`);
  }

  const [rows] = await connection.query(`
SELECT DISTINCT param_value
FROM (
    SELECT \`${eventParametersTable.paramsNameField}\` as param_value, \`${eventParametersTable.dateBasedCreatedAtField ?? eventParametersTable.createdAtField}\` as date
    FROM \`${eventParametersTable.name}\`
    ORDER BY \`${eventParametersTable.dateBasedCreatedAtField ?? eventParametersTable.createdAtField}\` DESC
) t
LIMIT 100;`);

  if (!Array.isArray(rows)) {
    throw new Error(`Invalid rows from warehouse`);
  }

  return compact(rows.map((row) => get(row, 'param_value', '')));
}
