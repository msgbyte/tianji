import { Prisma } from '@prisma/client';
import {
  FilterBooleanOperator,
  FilterDateOperator,
  FilterInfoType,
  FilterInfoValue,
  FilterNumberOperator,
  FilterStringOperator,
} from '@tianji/shared';
import { compact, get } from 'lodash-es';
import { castToDate, castToNumber, castToString } from '../../utils/cast.js';
import dayjs from 'dayjs';
import { insightsQuerySchema } from '../../utils/schema.js';
import { z } from 'zod';
import { POSTGRESQL_DATE_FORMATS, printSQL } from '../../utils/prisma.js';
import { env } from '../../utils/env.js';
import { clickhouse } from '../../clickhouse/index.js';
import { clickhouseHealthManager } from '../../clickhouse/health.js';
import { logger } from '../../utils/logger.js';
import { prisma } from '../_client.js';

// ClickHouse date formats for different time units
export const CLICKHOUSE_DATE_FORMATS = {
  minute: '%Y-%m-%d %H:%M:00',
  hour: '%Y-%m-%d %H:00:00',
  day: '%Y-%m-%d',
  month: '%Y-%m-01',
  year: '%Y-01-01',
};

export interface InsightEvent<
  T extends Record<string, any> = Record<string, any>,
> {
  id: string;
  name: string;
  createdAt: Date;
  properties: T;
}

export interface InsightsQueryContext {
  timezone: string;
  useClickhouse?: boolean;
}

export abstract class InsightsSqlBuilder {
  protected abstract getTableName(): string;

  protected resultLimit = 100; // set default result limit for insights query
  protected maxResultLimit = 1000; // set max result limit for insights query to avoid performance issues

  protected useClickhouse = env.clickhouse.enable;

  constructor(
    protected query: z.infer<typeof insightsQuerySchema>,
    protected context: InsightsQueryContext
  ) {
    if (typeof context.useClickhouse === 'boolean') {
      this.useClickhouse = context.useClickhouse;
    }
  }

  /**
   * Dynamically check if ClickHouse should be used
   */
  protected shouldUseClickhouse(): boolean {
    return this.useClickhouse && clickhouseHealthManager.isClickHouseHealthy();
  }

  protected getDateQuery(
    field: string,
    unit: string,
    timezone: string
  ): Prisma.Sql {
    if (this.shouldUseClickhouse()) {
      return this.getClickHouseDateQuery(field, unit, timezone);
    }

    // Check if unit exists in POSTGRESQL_DATE_FORMATS before using it
    if (!(unit in POSTGRESQL_DATE_FORMATS)) {
      throw new Error(`Invalid date unit: ${unit}`);
    }

    return Prisma.sql`to_char(date_trunc(${unit}, ${Prisma.raw(field)} at time zone ${timezone}), '${Prisma.raw(POSTGRESQL_DATE_FORMATS[unit as keyof typeof POSTGRESQL_DATE_FORMATS])}')`;
  }

  protected getClickHouseDateQuery(
    field: string,
    unit: string,
    timezone: string
  ): Prisma.Sql {
    // Check if unit exists in CLICKHOUSE_DATE_FORMATS before using it
    if (!(unit in CLICKHOUSE_DATE_FORMATS)) {
      throw new Error(`Invalid date unit: ${unit}`);
    }

    const format =
      CLICKHOUSE_DATE_FORMATS[unit as keyof typeof CLICKHOUSE_DATE_FORMATS];

    // ClickHouse uses different functions for date manipulation
    // Use Prisma.raw for string literals to avoid parameter binding issues
    if (unit === 'minute') {
      return Prisma.sql`formatDateTime(toStartOfMinute(${Prisma.raw(field)}, '${Prisma.raw(timezone)}'), '${Prisma.raw(format)}')`;
    } else if (unit === 'hour') {
      return Prisma.sql`formatDateTime(toStartOfHour(${Prisma.raw(field)}, '${Prisma.raw(timezone)}'), '${Prisma.raw(format)}')`;
    } else if (unit === 'day') {
      return Prisma.sql`formatDateTime(toStartOfDay(${Prisma.raw(field)}, '${Prisma.raw(timezone)}'), '${Prisma.raw(format)}')`;
    } else if (unit === 'month') {
      return Prisma.sql`formatDateTime(toStartOfMonth(${Prisma.raw(field)}, '${Prisma.raw(timezone)}'), '${Prisma.raw(format)}')`;
    } else if (unit === 'year') {
      return Prisma.sql`formatDateTime(toStartOfYear(${Prisma.raw(field)}, '${Prisma.raw(timezone)}'), '${Prisma.raw(format)}')`;
    }

    return Prisma.sql`formatDateTime(toStartOfDay(${Prisma.raw(field)}, '${Prisma.raw(timezone)}'), '${Prisma.raw(format)}')`;
  }

  protected buildGroupByText(length: number): string {
    return Array.from({ length })
      .map((_, i) => `${i + 1}`)
      .join(' , ');
  }

  protected buildDateRangeQuery(
    field: string,
    startAt: number,
    endAt: number
  ): Prisma.Sql {
    if (this.shouldUseClickhouse()) {
      // NOTICE: ClickHouse needs proper DateTime conversion functions
      const startTime = dayjs(startAt).utc().format('YYYY-MM-DD HH:mm:ss');
      const endTime = dayjs(endAt).utc().format('YYYY-MM-DD HH:mm:ss');
      return Prisma.sql`${Prisma.raw(field)} BETWEEN toDateTime(${startTime}, 'UTC') AND toDateTime(${endTime}, 'UTC')`;
    }

    return Prisma.sql`${Prisma.raw(field)} between ${dayjs(startAt).toISOString()}::timestamptz and ${dayjs(endAt).toISOString()}::timestamptz`;
  }

  public buildCommonFilterQueryOperator(
    type: FilterInfoType,
    _operator: string,
    value: FilterInfoValue | null,
    valueField: Prisma.Sql
  ): Prisma.Sql {
    if (type === 'number') {
      return this.buildNumberFilterOperator(
        _operator as FilterNumberOperator,
        value,
        valueField
      );
    } else if (type === 'string') {
      return this.buildStringFilterOperator(
        _operator as FilterStringOperator,
        value,
        valueField
      );
    } else if (type === 'boolean') {
      return this.buildBooleanFilterOperator(
        _operator as FilterBooleanOperator,
        value,
        valueField
      );
    } else if (type === 'date') {
      return this.buildDateFilterOperator(
        _operator as FilterDateOperator,
        value,
        valueField
      );
    }

    return Prisma.sql`1 = 1`;
  }

  private buildNumberFilterOperator(
    operator: FilterNumberOperator,
    value: FilterInfoValue | null,
    valueField: Prisma.Sql
  ): Prisma.Sql {
    if (operator === 'equals') {
      return Prisma.sql`${valueField} = ${castToNumber(value)}`;
    }
    if (operator === 'not equals') {
      return Prisma.sql`${valueField} != ${castToNumber(value)}`;
    }
    if (operator === 'in list' && Array.isArray(value)) {
      return Prisma.sql`${valueField} IN (${value.join(',')})`;
    }
    if (operator === 'not in list' && Array.isArray(value)) {
      return Prisma.sql`${valueField} NOT IN (${value.join(',')})`;
    }
    if (operator === 'greater than') {
      return Prisma.sql`${valueField} > ${castToNumber(value)}`;
    }
    if (operator === 'greater than or equal') {
      return Prisma.sql`${valueField} >= ${castToNumber(value)}`;
    }
    if (operator === 'less than') {
      return Prisma.sql`${valueField} < ${castToNumber(value)}`;
    }
    if (operator === 'less than or equal') {
      return Prisma.sql`${valueField} <= ${castToNumber(value)}`;
    }
    if (operator === 'between') {
      return Prisma.sql`${valueField} BETWEEN ${castToNumber(get(value, '0'))} AND ${castToNumber(get(value, '1'))}`;
    }

    return Prisma.sql`1 = 1`;
  }

  private buildStringFilterOperator(
    operator: FilterStringOperator,
    value: FilterInfoValue | null,
    valueField: Prisma.Sql
  ): Prisma.Sql {
    if (operator === 'equals') {
      return Prisma.sql`${valueField} = ${castToString(value)}`;
    }
    if (operator === 'not equals') {
      return Prisma.sql`${valueField} != ${castToString(value)}`;
    }
    if (operator === 'contains') {
      return Prisma.sql`${valueField} LIKE ${`%${castToString(value)}%`}`;
    }
    if (operator === 'not contains') {
      return Prisma.sql`${valueField} NOT LIKE ${`%${castToString(value)}%`}`;
    }
    if (operator === 'in list' && Array.isArray(value)) {
      return Prisma.sql`${valueField} IN (${Prisma.join(value, ' , ')})`;
    }
    if (operator === 'not in list' && Array.isArray(value)) {
      return Prisma.sql`${valueField} NOT IN (${value.join(',')})`;
    }

    return Prisma.sql`1 = 1`;
  }

  private buildBooleanFilterOperator(
    operator: FilterBooleanOperator,
    value: FilterInfoValue | null,
    valueField: Prisma.Sql
  ): Prisma.Sql {
    if (operator === 'equals') {
      return Prisma.sql`${valueField} = ${castToNumber(value)}`;
    }
    if (operator === 'not equals') {
      return Prisma.sql`${valueField} != ${castToNumber(value)}`;
    }

    return Prisma.sql`1 = 1`;
  }

  private buildDateFilterOperator(
    operator: FilterDateOperator,
    value: FilterInfoValue | null,
    valueField: Prisma.Sql
  ): Prisma.Sql {
    if (operator === 'between') {
      return Prisma.sql`${valueField} BETWEEN ${castToDate(get(value, '0')).toISOString()} AND ${castToDate(get(value, '1')).toISOString()}`;
    }
    if (operator === 'in day') {
      return Prisma.sql`${valueField} = DATE(${castToDate(value).toISOString()})`;
    }

    return Prisma.sql`1 = 1`;
  }

  protected buildSelectQueryArr(): (Prisma.Sql | null)[] {
    return [];
  }

  protected buildGroupSelectQueryArr(): Prisma.Sql[] {
    return [];
  }

  protected buildInnerJoinQuery(): Prisma.Sql {
    return Prisma.empty;
  }

  protected buildWhereQueryArr(): Prisma.Sql[] {
    return [];
  }

  protected buildDateQuerySql(): Prisma.Sql {
    const { time } = this.query;
    const { unit, timezone = 'UTC' } = time;
    const tableName = this.getTableName();

    return Prisma.sql`${this.getDateQuery(`"${tableName}"."createdAt"`, unit, timezone)} date`;
  }

  public build(): Prisma.Sql {
    const tableName = this.getTableName();
    const selectQueryArr = this.buildSelectQueryArr();
    const groupSelectQueryArr = this.buildGroupSelectQueryArr();
    const innerJoinQuery = this.buildInnerJoinQuery();
    const whereQueryArr = this.buildWhereQueryArr();

    const groupByText = this.buildGroupByText(groupSelectQueryArr.length + 1);

    let sql: Prisma.Sql;

    sql = Prisma.sql`select
        ${Prisma.join(
          compact([
            this.buildDateQuerySql(),
            ...groupSelectQueryArr,
            ...selectQueryArr,
          ]),
          ' , '
        )}
      from "${Prisma.raw(tableName)}" ${innerJoinQuery}
      where ${Prisma.join(whereQueryArr, ' AND ')}
      group by ${Prisma.raw(groupByText)}
      order by 1 desc
      limit ${Prisma.raw(String(this.maxResultLimit))}`;

    if (env.debugInsights) {
      printSQL(sql);
    }

    return sql;
  }

  public buildFetchEventsQuery(cursor: string | undefined): Prisma.Sql {
    const tableName = this.getTableName();
    const whereQueryArr = this.buildWhereQueryArr();
    const innerJoinQuery = this.buildInnerJoinQuery();

    return Prisma.sql`
      select *
      from "${Prisma.raw(tableName)}"
      ${innerJoinQuery}
      where ${Prisma.join(whereQueryArr, ' AND ')}
      ${cursor ? Prisma.sql`AND "${Prisma.raw(tableName)}"."id" < ${cursor}` : Prisma.empty}
      order by "${Prisma.raw(tableName)}"."createdAt" desc
      limit ${this.resultLimit}
    `;
  }

  public async executeQuery(sql: Prisma.Sql): Promise<any[]> {
    const shouldUseClickhouse = this.shouldUseClickhouse();

    if (shouldUseClickhouse) {
      try {
        // transform prisma sql to clickhouse sql
        let index = 0;
        const values = sql.values;
        const queryParams: Record<string, any> = {};
        const query = sql.sql.replace(/\?/g, () => {
          const fieldName = `field${index}`;
          queryParams[fieldName] = values[index];

          const type = typeof values[index];
          if (type === 'number') {
            return `{${fieldName}:UInt64}`;
          } else if (type === 'boolean') {
            return `{${fieldName}:UInt8}`;
          }

          index++;

          return `{${fieldName}:String}`;
        });

        if (env.debugInsights) {
          console.log('clickhouse query', query, queryParams);
        }

        const result = await clickhouse.query({
          query,
          query_params: queryParams,
        });

        const { data } = await result.json();
        return data;
      } catch (error) {
        // ClickHouse query failed, fallback to PostgreSQL
        logger.warn(
          `ClickHouse query failed, falling back to PostgreSQL: ${error}`
        );

        // Trigger health check re-evaluation
        clickhouseHealthManager.forceHealthCheck().catch(() => {
          // Ignore health check failure as we're already in fallback handling
        });

        // Execute PostgreSQL query
        return await prisma.$queryRaw(sql);
      }
    } else {
      return await prisma.$queryRaw(sql);
    }
  }

  public async queryEvents(
    cursor: string | undefined
  ): Promise<InsightEvent[]> {
    return [];
  }
}
