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
