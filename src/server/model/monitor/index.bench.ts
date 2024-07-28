import { describe, bench } from 'vitest';
import { prisma } from '../_client.js';

const workspaceId = process.env.BENCH_MONITOR_WORKSPACEID;
const monitorId = process.env.BENCH_MONITOR_ID;

describe.runIf(workspaceId && monitorId)('getMonitorRecentData', () => {
  bench('find with join', async () => {
    await prisma.monitorData
      .findMany({
        where: {
          monitor: {
            id: monitorId,
            workspaceId,
          },
        },
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          value: true,
          createdAt: true,
        },
      })
      .then((arr) => arr.reverse());
  });

  bench('find with double check', async () => {
    await prisma.monitor.findFirstOrThrow({
      where: {
        workspaceId,
        id: monitorId,
      },
    });

    await prisma.monitorData
      .findMany({
        where: {
          monitorId,
        },
        take: 20,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          value: true,
          createdAt: true,
        },
      })
      .then((arr) => arr.reverse());
  });
});
