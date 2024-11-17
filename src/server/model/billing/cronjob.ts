import pMap from 'p-map';
import { prisma } from '../_client.js';
import { WorkspaceSubscriptionTier } from '@prisma/client';
import { logger } from '../../utils/logger.js';
import { getTierLimit } from './limit.js';
import {
  checkWorkspaceUsageAndUpdateStatus,
  getWorkspaceUsage,
  pauseWorkspace,
} from './workspace.js';
import dayjs from 'dayjs';
import { getWorkspaceServiceCount } from '../workspace.js';

/**
 * Check workspace usage
 * if over limit, pause workspace
 */
export async function checkWorkspaceUsage() {
  logger.info('[checkWorkspaceUsage] Start run checkWorkspaceUsage');

  const workspaces = await prisma.workspace.findMany({
    select: {
      id: true,
    },
  });

  await pMap(
    workspaces,
    async (workspace) => {
      await checkWorkspaceUsageAndUpdateStatus(workspace.id);
    },
    {
      concurrency: 5,
    }
  );
}
