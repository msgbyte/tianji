import { publicProcedure, router, workspaceOwnerProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../../model/_client';
import { workspaceDashboardLayoutSchema } from '../../model/_schema';
import { Prisma } from '@prisma/client';

export const workspaceRouter = router({
  getUserWorkspaceRole: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        workspaceId: z.string(),
      })
    )
    .output(z.string().nullable())
    .query(async ({ input }) => {
      const { userId, workspaceId } = input;

      const relation = await prisma.workspacesOnUsers.findUnique({
        where: {
          userId_workspaceId: {
            workspaceId,
            userId,
          },
        },
      });

      return relation?.role ?? null;
    }),
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
