import { Prisma } from '@prisma/client';
import {
  findWarehouseApplication,
  WarehouseWideTableInsightsApplication,
} from './utils.js';
import dayjs from 'dayjs';
import { env } from '../../../utils/env.js';

export async function buildRetentionQuery(
  workspaceId: string,
  warehouseWideApplicationId: string,
  startAt: number,
  endAt: number
): Promise<Prisma.Sql> {
  const { sql, raw } = Prisma;
  const userApplicationId = env.insights.warehouse.retention.userApplicationId;

  // Only support wideTable application for retention
  const app = (await findWarehouseApplication(
    workspaceId,
    warehouseWideApplicationId
  )) as WarehouseWideTableInsightsApplication | undefined;

  if (!app || app.type !== 'wideTable') {
    throw new Error(
      `Retention only supports warehouse wideTable application, got: ${app?.type ?? 'unknown'}`
    );
  }

  const eventTableName = app.tableName;
  const eventUserIdField = app.distinctField;

  // Resolve user application (from env) for cohort definition
  if (!userApplicationId) {
    throw new Error(
      'env.insights.warehouse.retention.userApplicationId is not set'
    );
  }
  const userApp = (await findWarehouseApplication(
    workspaceId,
    userApplicationId
  )) as WarehouseWideTableInsightsApplication | undefined;
  if (!userApp || userApp.type !== 'wideTable') {
    throw new Error(
      `User application for retention must be a wideTable, got: ${userApp?.type ?? 'unknown'}`
    );
  }

  // Helpers to build date expr and range for a specific application/alias
  const buildActivityDateExprForApp = (
    application: WarehouseWideTableInsightsApplication,
    alias: string
  ): Prisma.Sql => {
    if (application.dateBasedCreatedAtField) {
      return sql`"${raw(alias)}"."${raw(application.dateBasedCreatedAtField)}"`;
    }

    const field = `"${alias}"."${application.createdAtField}"`;
    const type = application.createdAtFieldType ?? 'timestampMs';

    if (type === 'timestamp') {
      return sql`DATE(FROM_UNIXTIME(${raw(field)}))`;
    }
    if (type === 'timestampMs') {
      return sql`DATE(FROM_UNIXTIME(${raw(field)} / 1000))`;
    }
    if (type === 'date') {
      return sql`DATE(${raw(field)})`;
    }
    if (type === 'datetime') {
      return sql`DATE(${raw(field)})`;
    }
    return sql`DATE(FROM_UNIXTIME(${raw(field)} / 1000))`;
  };

  const buildDateRangeConditionForApp = (
    application: WarehouseWideTableInsightsApplication,
    alias: string
  ): Prisma.Sql => {
    const hasDateBased = Boolean(application.dateBasedCreatedAtField);
    const type = application.createdAtFieldType ?? 'timestampMs';
    const field = hasDateBased
      ? sql`"${raw(alias)}"."${raw(application.dateBasedCreatedAtField!)}"`
      : sql`"${raw(alias)}"."${raw(application.createdAtField)}"`;

    if (hasDateBased) {
      const startTime = dayjs(startAt).startOf('day').format('YYYY-MM-DD');
      const endTime = dayjs(endAt).endOf('day').format('YYYY-MM-DD');
      return sql`${field} BETWEEN ${startTime} AND ${endTime}`;
    }

    if (type === 'timestamp') {
      const startTime = String(dayjs(startAt).unix());
      const endTime = String(dayjs(endAt).unix());
      return sql`${field} BETWEEN ${startTime} AND ${endTime}`;
    }
    if (type === 'timestampMs') {
      const startTime = String(dayjs(startAt).valueOf());
      const endTime = String(dayjs(endAt).valueOf());
      return sql`${field} BETWEEN ${startTime} AND ${endTime}`;
    }
    if (type === 'date') {
      const startTime = dayjs(startAt).startOf('day').format('YYYY-MM-DD');
      const endTime = dayjs(endAt).endOf('day').format('YYYY-MM-DD');
      return sql`${field} BETWEEN ${startTime} AND ${endTime}`;
    }
    if (type === 'datetime') {
      const startTime = dayjs(startAt).utc().format('YYYY-MM-DD HH:mm:ss');
      const endTime = dayjs(endAt).utc().format('YYYY-MM-DD HH:mm:ss');
      return sql`${field} BETWEEN ${startTime} AND ${endTime}`;
    }

    const startTime = String(dayjs(startAt).valueOf());
    const endTime = String(dayjs(endAt).valueOf());
    return sql`${field} BETWEEN ${startTime} AND ${endTime}`;
  };

  const query = sql`
WITH "first_seen" AS (
  SELECT
    "${raw(userApp.distinctField)}" AS "user_id",
    MIN(${buildActivityDateExprForApp(userApp, 'u')}) AS "cohort_date"
  FROM "${raw(userApp.tableName)}" AS "u"
  WHERE ${buildDateRangeConditionForApp(userApp, 'u')}
  GROUP BY "${raw(userApp.distinctField)}"
)
SELECT
  "fs"."cohort_date" AS "date",
  COUNT(DISTINCT "fs"."user_id") AS "cohort_size",
  COUNT(DISTINCT CASE WHEN DATEDIFF(${buildActivityDateExprForApp(app, 'e')}, "fs"."cohort_date") = 1 THEN "fs"."user_id" END) AS "d1",
  COUNT(DISTINCT CASE WHEN DATEDIFF(${buildActivityDateExprForApp(app, 'e')}, "fs"."cohort_date") = 3 THEN "fs"."user_id" END) AS "d3",
  COUNT(DISTINCT CASE WHEN DATEDIFF(${buildActivityDateExprForApp(app, 'e')}, "fs"."cohort_date") = 5 THEN "fs"."user_id" END) AS "d5",
  COUNT(DISTINCT CASE WHEN DATEDIFF(${buildActivityDateExprForApp(app, 'e')}, "fs"."cohort_date") = 7 THEN "fs"."user_id" END) AS "d7",
  COUNT(DISTINCT CASE WHEN DATEDIFF(${buildActivityDateExprForApp(app, 'e')}, "fs"."cohort_date") = 14 THEN "fs"."user_id" END) AS "d14"
FROM "first_seen" AS "fs"
LEFT JOIN "${raw(eventTableName)}" AS "e" ON "e"."${raw(eventUserIdField)}" = "fs"."user_id" AND ${buildDateRangeConditionForApp(app, 'e')}
GROUP BY 1
ORDER BY 1 DESC`;

  return query;
}
