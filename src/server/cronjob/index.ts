import { Cron } from 'croner';
import { logger } from '../utils/logger';
import { prisma } from '../model/_client';
import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';

type WebsiteEventCountSqlReturn = {
  workspace_id: string;
  count: bigint;
}[];

export function initCronjob() {
  const dailyJob = Cron('0 2 * * *', async () => {
    logger.info('Start statistics usage');

    await statdailyUsage();
  });

  logger.info('Daily job will start at:', dailyJob.nextRun()?.toISOString());
}

async function statdailyUsage() {
  logger.info('Statistics Workspace Daily Usage Start');
  const start = dayjs().subtract(1, 'day').startOf('day').toDate();
  const end = dayjs().startOf('day').toDate();
  const date = dayjs().subtract(1, 'day').toDate();

  const [websiteAcceptCountRes, websiteEventCountRes, monitorExecutionCount] =
    await Promise.all([
      await prisma.$queryRaw<WebsiteEventCountSqlReturn>`
        SELECT
          w.id AS workspace_id,
          COALESCE(COUNT(we.id), 0) AS count
        FROM
          "Workspace" w
        LEFT JOIN
          "Website" ws ON w.id = ws."workspaceId"
        LEFT JOIN
          "WebsiteEvent" we ON ws.id = we."websiteId"
            AND we."createdAt" >= ${start}
            AND we."createdAt" < ${end}
        GROUP BY
          w.id, w.name
        ORDER BY
          w.id`,
      await prisma.$queryRaw<WebsiteEventCountSqlReturn>`
        SELECT
          w.id AS workspace_id,
          COALESCE(COUNT(we.id), 0) AS count
        FROM
          "Workspace" w
        LEFT JOIN
          "Website" ws ON w.id = ws."workspaceId"
        LEFT JOIN
          "WebsiteEvent" we ON ws.id = we."websiteId"
            AND we."eventType" = 2
            AND we."createdAt" >= ${start}
            AND we."createdAt" < ${end}
        GROUP BY
          w.id, w.name
        ORDER BY
          w.id`,
      await prisma.$queryRaw<WebsiteEventCountSqlReturn>`
        SELECT
          w.id AS workspace_id,
          COALESCE(COUNT(md.id), 0) AS count
        FROM
          "Workspace" w
        LEFT JOIN
          "Monitor" m ON w.id = m."workspaceId"
        LEFT JOIN
          "MonitorData" md ON m.id = md."monitorId"
            AND md."createdAt" >= ${start}
            AND md."createdAt" < ${end}
        GROUP BY
          w.id
        ORDER BY
          w.id`,
    ]);

  const map: Map<string, Prisma.WorkspaceDailyUsageCreateManyInput> = new Map();

  const blank: Omit<Prisma.WorkspaceDailyUsageCreateManyInput, 'workspaceId'> =
    {
      websiteAcceptedCount: 0,
      websiteEventCount: 0,
      monitorExecutionCount: 0,
      date,
    };

  websiteAcceptCountRes.forEach((item) => {
    const workspaceId = item.workspace_id;
    map.set(workspaceId, {
      ...blank,
      ...map.get(workspaceId),
      workspaceId,
      websiteAcceptedCount: Number(item.count),
    });
  });

  websiteEventCountRes.forEach((item) => {
    const workspaceId = item.workspace_id;
    map.set(workspaceId, {
      ...blank,
      ...map.get(workspaceId),
      workspaceId,
      websiteEventCount: Number(item.count),
    });
  });

  monitorExecutionCount.forEach((item) => {
    const workspaceId = item.workspace_id;
    map.set(workspaceId, {
      ...blank,
      ...map.get(workspaceId),
      workspaceId,
      monitorExecutionCount: Number(item.count),
    });
  });

  await prisma.workspaceDailyUsage.createMany({
    data: Array.from(map.values()),
    skipDuplicates: true,
  });

  logger.info('Statistics Workspace Daily Usage Completed');
}
