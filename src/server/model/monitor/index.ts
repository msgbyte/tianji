import dayjs from 'dayjs';
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

export async function getMonitorSummaryWithDay(
  monitorId: string,
  beforeDay: number = 30
) {
  interface MonitorSummaryItem {
    day: string;
    total_count: number;
    up_count: number;
    up_rate: number;
  }

  const list = await prisma.$queryRaw<MonitorSummaryItem[]>`
    SELECT
      TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') AS day,
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

  const map: Record<string, MonitorSummaryItem> = {};
  for (const item of list) {
    const date = dayjs(item.day).format('YYYY-MM-DD');
    map[date] = item;
  }

  return Array.from({ length: beforeDay }).map((_, i) => {
    const target = dayjs().subtract(i, 'days').format('YYYY-MM-DD');

    if (map[target]) {
      return {
        day: target,
        totalCount: Number(map[target].total_count),
        upCount: Number(map[target].up_count),
        upRate: Number(Number(map[target].up_rate).toFixed(1)),
      };
    } else {
      return {
        day: target,
        totalCount: 0,
        upCount: 0,
        upRate: 0,
      };
    }
  });
}
