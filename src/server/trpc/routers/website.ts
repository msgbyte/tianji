import { router, workspaceProcedure } from '../trpc';
import { z } from 'zod';
import { getWebsiteOnlineUserCount } from '../../model/website';
import { prisma } from '../../model/_client';

export const websiteRouter = router({
  onlineCount: workspaceProcedure
    .input(
      z.object({
        websiteId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const websiteId = input.websiteId;

      const count = await getWebsiteOnlineUserCount(websiteId);

      return count;
    }),
  info: workspaceProcedure
    .input(
      z.object({
        websiteId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { websiteId, workspaceId } = input;

      const website = await prisma.website.findUnique({
        where: {
          id: websiteId,
        },
      });

      return website;
    }),
});
