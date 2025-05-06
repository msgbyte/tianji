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

export interface InsightEvent<
  T extends Record<string, any> = Record<string, any>,
> {
  id: string;
  name: string;
  properties: T;
}

export abstract class InsightsSqlBuilder {
  protected abstract getTableName(): string;

  constructor(
    protected query: z.infer<typeof insightsQuerySchema>,
    protected context: { timezone: string }
  ) {}

  protected getDateQuery(
    field: string,
    unit: string,
    timezone: string
  ): Prisma.Sql {
    // Check if unit exists in POSTGRESQL_DATE_FORMATS before using it
    if (!(unit in POSTGRESQL_DATE_FORMATS)) {
      throw new Error(`Invalid date unit: ${unit}`);
    }

    return Prisma.sql`to_char(date_trunc(${unit}, ${Prisma.raw(field)} at time zone ${timezone}), '${Prisma.raw(POSTGRESQL_DATE_FORMATS[unit as keyof typeof POSTGRESQL_DATE_FORMATS])}')`;
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

  public build(): Prisma.Sql {
    const { time } = this.query;
    const { unit } = time;

    const timezone = dayjs.tz.guess(); // Get host timezone which can be used in date query

    const tableName = this.getTableName();
    const selectQueryArr = this.buildSelectQueryArr();
    const groupSelectQueryArr = this.buildGroupSelectQueryArr();
    const innerJoinQuery = this.buildInnerJoinQuery();
    const whereQueryArr = this.buildWhereQueryArr();

    const groupByText = this.buildGroupByText(groupSelectQueryArr.length + 1);

    const sql = Prisma.sql`select
      ${Prisma.join(
        compact([
          Prisma.sql`${this.getDateQuery(`"${tableName}"."createdAt"`, unit, timezone)} date`,
          ...groupSelectQueryArr,
          ...selectQueryArr,
        ]),
        ' , '
      )}
    from "${Prisma.raw(tableName)}" ${innerJoinQuery}
    where ${Prisma.join(whereQueryArr, ' AND ')}
    group by ${Prisma.raw(groupByText)}`;

    if (env.debugInsights) {
      printSQL(sql);
    }

    return sql;
  }

  public buildFetchEventsQuery(): Prisma.Sql {
    const tableName = this.getTableName();
    const whereQueryArr = this.buildWhereQueryArr();

    return Prisma.sql`
      select *
      from "${Prisma.raw(tableName)}"
      where ${Prisma.join(whereQueryArr, ' AND ')}
      order by "createdAt" desc
      limit 100
    `;
  }

  public async queryEvents(): Promise<InsightEvent[]> {
    return [];
  }
}
