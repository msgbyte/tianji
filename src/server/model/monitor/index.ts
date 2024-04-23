import { prisma } from '../_client';
import { MonitorPublicInfoSchema } from '../_schema/monitor';
import { MonitorManager } from './manager';

export const monitorManager = new MonitorManager();

export async function getMonitorPublicInfos(monitorIds: string[]) {
  const res = await prisma.monitor.findMany({
    where: {
      id: {
        in: monitorIds,
      },
    },
  });

  return res.map((item) => MonitorPublicInfoSchema.parse(item));
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
