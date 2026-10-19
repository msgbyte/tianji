import { prisma } from '../_client.js';
import {
  BaseQueryFilters,
  getDateQuery,
  getTimestampIntervalQuery,
} from '../../utils/prisma.js';
import { formatDate, getDateArray } from '@tianji/shared';
import { z } from 'zod';

export const eventStatsQueryResultItemSchema = z.object({
  date: z.string(),
  eventCount: z.number(),
  sessionCount: z.number(),
  totalTime: z.number(),
  avgEventsPerSession: z.number(),
  avgScreensPerSession: z.number(),
});

export const eventBreakdownItemSchema = z.object({
  date: z.string(),
  eventName: z.string().nullable(),
  eventCount: z.number(),
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
  eventBreakdown: z.infer<typeof eventBreakdownItemSchema>[];
  currentTotalSessionCount: number;
  previousTotalSessionCount: number;
}> {
  const { startDate, endDate, timezone = 'utc', unit = 'day' } = filters;

  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }

  // Calculate previous period
  const diffInMs = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - diffInMs);
  const prevEndDate = new Date(endDate.getTime() - diffInMs);

  // Execute all queries in parallel
  const [
    currentStats,
    currentTotalResult,
    prevStats,
    previousTotalResult,
    eventBreakdown,
  ] = await Promise.all([
    // Get current period stats
    prisma.$queryRaw<EventStatsQueryResultItem[]>`
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
      `,
    // Get current period total session count
    prisma.$queryRaw<{ totalSessionCount: bigint }[]>`
        SELECT
          COUNT(DISTINCT "sessionId") as "totalSessionCount"
        FROM "ApplicationEvent"
        WHERE "applicationId" = ${applicationId}
          AND "createdAt" BETWEEN ${startDate.toISOString()}::timestamptz AND ${endDate.toISOString()}::timestamptz
      `,
    // Get previous period stats
    prisma.$queryRaw<EventStatsQueryResultItem[]>`
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
      `,
    // Get previous period total session count
    prisma.$queryRaw<{ totalSessionCount: bigint }[]>`
        SELECT
          COUNT(DISTINCT "sessionId") as "totalSessionCount"
        FROM "ApplicationEvent"
        WHERE "applicationId" = ${applicationId}
          AND "createdAt" BETWEEN ${prevStartDate.toISOString()}::timestamptz AND ${prevEndDate.toISOString()}::timestamptz
      `,
    prisma.$queryRaw<
      { date: string; eventName: string | null; eventCount: bigint }[]
    >`
        WITH event_counts AS (
          SELECT
            ${getDateQuery('"ApplicationEvent"."createdAt"', unit, timezone)} date,
            "eventName",
            COUNT(*) AS "eventCount"
          FROM "ApplicationEvent"
          WHERE "applicationId" = ${applicationId}
            AND "createdAt" BETWEEN ${startDate.toISOString()}::timestamptz AND ${endDate.toISOString()}::timestamptz
          GROUP BY 1, 2
        ), top_events AS (
          SELECT "eventName"
          FROM event_counts
          WHERE "eventName" IS NOT NULL
          GROUP BY "eventName"
          ORDER BY SUM("eventCount") DESC, "eventName" ASC
          LIMIT 9
        )
        SELECT
          event_counts.date,
          top_events."eventName",
          SUM(event_counts."eventCount") AS "eventCount"
        FROM event_counts
        LEFT JOIN top_events ON event_counts."eventName" = top_events."eventName"
        GROUP BY 1, 2
        ORDER BY 1, 2
      `,
  ]);

  // Format the results
  return {
    eventBreakdown: eventBreakdown.map((item) => ({
      // SQL buckets already use the requested timezone.
      date: formatDate(item.date),
      eventName: item.eventName,
      eventCount: Number(item.eventCount),
    })),
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
    currentTotalSessionCount: Number(
      currentTotalResult[0]?.totalSessionCount ?? 0
    ),
    previousTotalSessionCount: Number(
      previousTotalResult[0]?.totalSessionCount ?? 0
    ),
  };
}
