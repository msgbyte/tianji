import { prisma } from '../_client.js';
import { monitorPublicInfoSchema } from '../_schema/monitor.js';
import { MonitorManager } from './manager.js';

export const monitorManager = new MonitorManager();

export async function getMonitorPublicInfos(monitorIds: string[]) {
  const res = await prisma.monitor.findMany({
    where: {
      id: {
        in: monitorIds,
      },
    },
  });

  return res.map((item) => monitorPublicInfoSchema.parse(item));
}

export function getMonitorData(
  workspaceId: string,
  monitorId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.monitorData.findMany({
    where: {
      monitor: {
        id: monitorId,
        workspaceId,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      value: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

export function getMonitorRecentData(
  workspaceId: string,
  monitorId: string,
  take: number
) {
  return prisma.monitorData
    .findMany({
      where: {
        monitor: {
          id: monitorId,
          workspaceId,
        },
      },
      take,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        value: true,
        createdAt: true,
      },
    })
    .then((arr) => arr.reverse());
}

export function getMonitorSummaryWithDay(
  monitorId: string,
  beforeDay: number = 30
) {
  interface MonitorSummaryItem {
    day: string;
    total_count: number;
    up_count: number;
    up_rate: number;
  }

  return prisma.$queryRaw<MonitorSummaryItem[]>`
    SELECT
      DATE("createdAt") AS day,
      COUNT(1) AS total_count,
      SUM(CASE WHEN "value" >= 0 THEN 1 ELSE 0 END) AS up_count,
      (SUM(CASE WHEN "value" >= 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(1)) AS up_rate
    FROM
      "MonitorData"
    WHERE
      "monitorId" = ${monitorId} AND
      "createdAt" >= CURRENT_DATE - INTERVAL '${beforeDay} days'
    GROUP BY
      DATE("createdAt")
    ORDER BY
      day;`;
}
