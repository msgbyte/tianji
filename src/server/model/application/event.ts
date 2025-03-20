import { prisma } from '../_client.js';
import {
  BaseQueryFilters,
  getDateQuery,
  getTimestampIntervalQuery,
} from '../../utils/prisma.js';
import { getDateArray } from '@tianji/shared';
import { z } from 'zod';

export const eventStatsQueryResultItemSchema = z.object({
  date: z.string(),
  eventCount: z.number(),
  sessionCount: z.number(),
  totalTime: z.number(),
  avgEventsPerSession: z.number(),
  avgScreensPerSession: z.number(),
});

type EventStatsQueryResultItem = z.infer<
  typeof eventStatsQueryResultItemSchema
>;

/**
 * Get application event stats for a specific application
 * This function returns statistics about application events
 */
export async function getApplicationEventStats(
  applicationId: string,
  filters: BaseQueryFilters
): Promise<{
  current: EventStatsQueryResultItem[];
  previous: EventStatsQueryResultItem[];
}> {
  const { startDate, endDate, timezone = 'utc', unit = 'day' } = filters;

  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }

  // Get current period stats
  const currentStats = await prisma.$queryRaw<EventStatsQueryResultItem[]>`
    SELECT
      ${getDateQuery('"ApplicationEvent"."createdAt"', unit, timezone)} date,
      COUNT(*) as "eventCount",
      COUNT(DISTINCT "sessionId") as "sessionCount",
      ${getTimestampIntervalQuery('"ApplicationEvent"."createdAt"')} as "totalTime",
      ROUND(
        CAST(
          COUNT(DISTINCT CONCAT("sessionId", ':', "eventName")) AS DECIMAL
        ) /
        NULLIF(COUNT(DISTINCT "sessionId"), 0),
        2
      ) as "avgEventsPerSession",
      ROUND(
        CAST(
          COUNT(DISTINCT CASE WHEN "screenName" IS NOT NULL THEN CONCAT("sessionId", ':', "screenName") ELSE NULL END) AS DECIMAL
        ) /
        NULLIF(COUNT(DISTINCT "sessionId"), 0),
        2
      ) as "avgScreensPerSession"
    FROM "ApplicationEvent"
    WHERE "applicationId" = ${applicationId}
      AND "createdAt" BETWEEN ${startDate.toISOString()}::timestamptz AND ${endDate.toISOString()}::timestamptz
    GROUP BY 1
    ORDER BY 1
  `;

  // Calculate previous period
  const diffInMs = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - diffInMs);
  const prevEndDate = new Date(endDate.getTime() - diffInMs);

  // Get previous period stats
  const prevStats = await prisma.$queryRaw<EventStatsQueryResultItem[]>`
    SELECT
      ${getDateQuery('"ApplicationEvent"."createdAt"', unit, timezone)} date,
      COUNT(*) as "eventCount",
      COUNT(DISTINCT "sessionId") as "sessionCount",
      ${getTimestampIntervalQuery('"ApplicationEvent"."createdAt"')} as "totalTime",
      ROUND(
        CAST(
          COUNT(DISTINCT CONCAT("sessionId", ':', "eventName")) AS DECIMAL
        ) /
        NULLIF(COUNT(DISTINCT "sessionId"), 0),
        2
      ) as "avgEventsPerSession",
      ROUND(
        CAST(
          COUNT(DISTINCT CASE WHEN "screenName" IS NOT NULL THEN CONCAT("sessionId", ':', "screenName") ELSE NULL END) AS DECIMAL
        ) /
        NULLIF(COUNT(DISTINCT "sessionId"), 0),
        2
      ) as "avgScreensPerSession"
    FROM "ApplicationEvent"
    WHERE "applicationId" = ${applicationId}
      AND "createdAt" BETWEEN ${prevStartDate.toISOString()}::timestamptz AND ${prevEndDate.toISOString()}::timestamptz
    GROUP BY 1
    ORDER BY 1
  `;

  // Format the results
  return {
    current: getDateArray(
      currentStats.map((res) => ({
        date: res.date,
        eventCount: Number(res.eventCount),
        sessionCount: Number(res.sessionCount),
        totalTime: Number(res.totalTime),
        avgEventsPerSession: Number(res.avgEventsPerSession),
        avgScreensPerSession: Number(res.avgScreensPerSession),
      })),
      startDate,
      endDate,
      unit,
      timezone
    ),
    previous: getDateArray(
      prevStats.map((res) => ({
        date: res.date,
        eventCount: Number(res.eventCount),
        sessionCount: Number(res.sessionCount),
        totalTime: Number(res.totalTime),
        avgEventsPerSession: Number(res.avgEventsPerSession),
        avgScreensPerSession: Number(res.avgScreensPerSession),
      })),
      prevStartDate,
      prevEndDate,
      unit,
      timezone
    ),
  };
}
