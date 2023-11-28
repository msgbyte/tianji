import { router, workspaceOwnerProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../../model/_client';
import { workspaceDashboardLayoutSchema } from '../../model/_schema';
import { Prisma } from '@prisma/client';

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
  saveDashboardLayout: workspaceOwnerProcedure
    .input(
      z.object({
        dashboardLayout: workspaceDashboardLayoutSchema.nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { workspaceId, dashboardLayout } = input;

      await prisma.workspace.update({
        where: {
          id: workspaceId,
        },
        data: {
          dashboardLayout: dashboardLayout ?? Prisma.DbNull,
        },
      });
    }),
});
