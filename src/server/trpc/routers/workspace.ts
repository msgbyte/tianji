import { router, workspaceOwnerProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../../model/_client';

export const workspaceRouter = router({
  updateDashboardOrder: workspaceOwnerProcedure
    .input(
      z.object({
        dashboardOrder: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, dashboardOrder } = input;

      await prisma.workspace.update({
        where: {
          id: workspaceId,
        },
        data: {
          dashboardOrder,
        },
      });
    }),
});
