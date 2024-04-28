import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc';
import { z } from 'zod';
import { prisma } from '../../model/_client';
import { workspaceDashboardLayoutSchema } from '../../model/_schema';
import { Prisma } from '@prisma/client';
import { OPENAPI_TAG } from '../../utils/const';
import { OpenApiMeta } from 'trpc-openapi';
import { getServerCount } from '../../model/serverStatus';

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
  getServiceCount: workspaceProcedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'GET',
        path: '/getServiceCount',
      })
    )
    .output(
      z.object({
        website: z.number(),
        monitor: z.number(),
        server: z.number(),
        telemetry: z.number(),
        page: z.number(),
        survey: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const [website, monitor, telemetry, page, survey] = await Promise.all([
        prisma.website.count({
          where: {
            workspaceId,
          },
        }),
        prisma.monitor.count({
          where: {
            workspaceId,
          },
        }),
        prisma.telemetry.count({
          where: {
            workspaceId,
          },
        }),
        prisma.monitorStatusPage.count({
          where: {
            workspaceId,
          },
        }),
        prisma.survey.count({
          where: {
            workspaceId,
          },
        }),
      ]);

      const server = getServerCount(workspaceId);

      return {
        website,
        monitor,
        server,
        telemetry,
        page,
        survey,
      };
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

function buildWorkspaceOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.WORKSPACE],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}${meta.path}`,
    },
  };
}
