import { router, workspaceProcedure } from '../trpc';
import { z } from 'zod';
import { getWebsiteOnlineUserCount } from '../../model/website';

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
});
