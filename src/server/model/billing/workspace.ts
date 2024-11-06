import { WorkspaceSubscriptionTier } from '@prisma/client';
import { prisma } from '../_client.js';

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
      surveyCount: true,
      feedEventCount: true,
    },
  });

  return {
    websiteAcceptedCount: res._sum.websiteAcceptedCount ?? 0,
    websiteEventCount: res._sum.websiteEventCount ?? 0,
    monitorExecutionCount: res._sum.monitorExecutionCount ?? 0,
    surveyCount: res._sum.surveyCount ?? 0,
    feedEventCount: res._sum.feedEventCount ?? 0,
  };
}

export async function getWorkspaceSubscription(
  workspaceId: string
): Promise<WorkspaceSubscriptionTier> {
  const subscription = await prisma.workspaceSubscription.findFirst({
    where: {
      workspaceId,
    },
  });

  return subscription?.tier ?? WorkspaceSubscriptionTier.FREE;
}

export async function pauseWorkspace(workspaceId: string) {
  await prisma.workspace.update({
    where: {
      id: workspaceId,
    },
    data: {
      paused: true,
    },
  });
}
