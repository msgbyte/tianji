import { Prisma } from '@prisma/client';
import {
  FilterBooleanOperator,
  FilterDateOperator,
  FilterInfoType,
  FilterInfoValue,
  FilterNumberOperator,
  FilterStringOperator,
} from '@tianji/shared';
import { get } from 'lodash-es';
import { castToDate, castToNumber, castToString } from '../../utils/cast.js';

export function buildCommonFilterQueryOperator(
  type: FilterInfoType,
  _operator: string,
  value: FilterInfoValue | null,
  valueField: Prisma.Sql
) {
  if (type === 'number') {
    const operator = _operator as FilterNumberOperator;

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
  } else if (type === 'string') {
    const operator = _operator as FilterStringOperator;

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
      return Prisma.sql`${valueField} IN (${value.join(',')})`;
    }
    if (operator === 'not in list' && Array.isArray(value)) {
      return Prisma.sql`${valueField} NOT IN (${value.join(',')})`;
    }
  } else if (type === 'boolean') {
    const operator = _operator as FilterBooleanOperator;

    if (operator === 'equals') {
      return Prisma.sql`${valueField} = ${castToNumber(value)}`;
    }
    if (operator === 'not equals') {
      return Prisma.sql`${valueField} != ${castToNumber(value)}`;
    }
  } else if (type === 'date') {
    const operator = _operator as FilterDateOperator;

    if (operator === 'between') {
      return Prisma.sql`${valueField} BETWEEN ${castToDate(get(value, '0'))} AND ${castToDate(get(value, '1'))}`;
    }
    if (operator === 'in day') {
      return Prisma.sql`${valueField} = DATE(${castToDate(value)})`;
    }
  }

  return Prisma.sql`1 = 1`;
}
