import { prisma } from '../_client.js';
import { BaseQueryFilters, getDateQuery } from '../../utils/prisma.js';
import { getDateArray } from '@tianji/shared';
import { z } from 'zod';

export const eventStatsQueryResultItemSchema = z.object({
  date: z.string(),
  eventCount: z.number(),
  sessionCount: z.number(),
  uniqueEventCount: z.number(),
  uniqueScreenCount: z.number(),
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
      COUNT(DISTINCT CASE WHEN "eventName" IS NOT NULL THEN "eventName" ELSE NULL END) as "uniqueEventCount",
      COUNT(DISTINCT CASE WHEN "screenName" IS NOT NULL THEN "screenName" ELSE NULL END) as "uniqueScreenCount"
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
      COUNT(DISTINCT CASE WHEN "eventName" IS NOT NULL THEN "eventName" ELSE NULL END) as "uniqueEventCount",
      COUNT(DISTINCT CASE WHEN "screenName" IS NOT NULL THEN "screenName" ELSE NULL END) as "uniqueScreenCount"
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
        uniqueEventCount: Number(res.uniqueEventCount),
        uniqueScreenCount: Number(res.uniqueScreenCount),
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
        uniqueEventCount: Number(res.uniqueEventCount),
        uniqueScreenCount: Number(res.uniqueScreenCount),
      })),
      prevStartDate,
      prevEndDate,
      unit,
      timezone
    ),
  };
}
