import { WorkspaceSubscriptionTier } from '@prisma/client';
import { prisma } from '../_client.js';
import { buildQueryWithCache } from '../../cache/index.js';
import dayjs from 'dayjs';
import { getWorkspaceServiceCount } from '../workspace.js';
import { getTierLimit } from './limit.js';

export async function getWorkspaceUsage(
  workspaceId: string,
  startAt: number,
  endAt: number
) {
  const res = await prisma.workspaceDailyUsage.aggregate({
    where: {
      workspaceId,
      date: {
        gte: new Date(startAt),
        lte: new Date(endAt),
      },
    },
    _sum: {
      websiteAcceptedCount: true,
      websiteEventCount: true,
      monitorExecutionCount: true,
      feedEventCount: true,
    },
    _max: {
      surveyCount: true,
    },
  });

  return {
    websiteAcceptedCount: res._sum.websiteAcceptedCount ?? 0,
    websiteEventCount: res._sum.websiteEventCount ?? 0,
    monitorExecutionCount: res._sum.monitorExecutionCount ?? 0,
    surveyCount: res._max.surveyCount ?? 0,
    feedEventCount: res._sum.feedEventCount ?? 0,
  };
}

export async function getWorkspaceTier(
  workspaceId: string
): Promise<WorkspaceSubscriptionTier> {
  const subscription = await prisma.workspaceSubscription.findFirst({
    where: {
      workspaceId,
    },
  });

  return subscription?.tier ?? WorkspaceSubscriptionTier.FREE;
}

const { get: isWorkspacePaused, del: clearWorkspacePausedStatus } =
  buildQueryWithCache(async (workspaceId: string) => {
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    return workspace?.paused ?? false;
  });

export { isWorkspacePaused };

async function pauseWorkspace(workspaceId: string) {
  await prisma.workspace.update({
    where: {
      id: workspaceId,
    },
    data: {
      paused: true,
    },
  });

  await clearWorkspacePausedStatus(workspaceId);
}

async function recoverWorkspace(workspaceId: string) {
  await prisma.workspace.update({
    where: {
      id: workspaceId,
    },
    data: {
      paused: false,
    },
  });

  await clearWorkspacePausedStatus(workspaceId);
}

/**
 * Check workspace usage and update status, if over limit, pause workspace, else recover workspace status
 */
export async function checkWorkspaceUsageAndUpdateStatus(workspaceId: string) {
  const subscription = await getWorkspaceTier(workspaceId);

  if (subscription === WorkspaceSubscriptionTier.UNLIMITED) {
    return;
  }

  const [usage, serviceCount] = await Promise.all([
    getWorkspaceUsage(
      workspaceId,
      dayjs().startOf('month').valueOf(),
      dayjs().valueOf()
    ),
    getWorkspaceServiceCount(workspaceId),
  ]);

  const limit = getTierLimit(subscription);

  function checkValueOver(value: number, limit: number) {
    if (limit === -1) {
      return false;
    }

    return value > limit;
  }

  const overUsage =
    checkValueOver(serviceCount.website, limit.maxWebsiteCount) ||
    checkValueOver(usage.websiteEventCount, limit.maxWebsiteEventCount) ||
    checkValueOver(
      usage.monitorExecutionCount,
      limit.maxMonitorExecutionCount
    ) ||
    checkValueOver(usage.websiteEventCount, limit.maxWebsiteEventCount) ||
    checkValueOver(serviceCount.survey, limit.maxSurveyCount) ||
    checkValueOver(serviceCount.feed, limit.maxFeedChannelCount) ||
    checkValueOver(usage.feedEventCount, limit.maxFeedEventCount);

  if (overUsage) {
    // pause workspace
    await pauseWorkspace(workspaceId);
  } else {
    // recover workspace
    await recoverWorkspace(workspaceId);
  }
}
