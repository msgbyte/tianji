import pMap from 'p-map';
import { prisma } from '../_client.js';
import { WorkspaceSubscriptionTier } from '@prisma/client';
import { logger } from '../../utils/logger.js';
import { getTierLimit } from './limit.js';
import { getWorkspaceUsage, pauseWorkspace } from './workspace.js';
import dayjs from 'dayjs';
import { getWorkspaceServiceCount } from '../workspace.js';

/**
 * Check workspace usage
 * if over limit, pause workspace
 */
export async function checkWorkspaceUsage() {
  logger.info('[checkWorkspaceUsage] Start run checkWorkspaceUsage');

  const workspaces = await prisma.workspace.findMany({
    where: {
      paused: false,
    },
    include: {
      subscription: true,
    },
  });

  await pMap(
    workspaces,
    async (workspace) => {
      const tier =
        workspace.subscription?.tier ?? WorkspaceSubscriptionTier.FREE;

      if (tier === WorkspaceSubscriptionTier.UNLIMITED) {
        return;
      }

      const [usage, serviceCount] = await Promise.all([
        getWorkspaceUsage(
          workspace.id,
          dayjs().startOf('month').valueOf(),
          dayjs().valueOf()
        ),
        getWorkspaceServiceCount(workspace.id),
      ]);

      const limit = getTierLimit(tier);

      const overUsage =
        serviceCount.website > limit.maxWebsiteCount ||
        usage.websiteEventCount > limit.maxWebsiteEventCount ||
        usage.monitorExecutionCount > limit.maxMonitorExecutionCount ||
        usage.websiteEventCount > limit.maxWebsiteEventCount ||
        usage.surveyCount > limit.maxSurveyCount ||
        serviceCount.feed > limit.maxFeedChannelCount ||
        usage.feedEventCount > limit.maxFeedEventCount;

      if (overUsage) {
        // pause workspace
        await pauseWorkspace(workspace.id);
      }
    },
    {
      concurrency: 5,
    }
  );
}
