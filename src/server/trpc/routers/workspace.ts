import {
  OpenApiMetaInfo,
  protectProedure,
  publicProcedure,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { z } from 'zod';
import { prisma } from '../../model/_client.js';
import {
  userInfoSchema,
  workspaceDashboardLayoutSchema,
} from '../../model/_schema/index.js';
import { Prisma } from '@prisma/client';
import { OPENAPI_TAG } from '../../utils/const.js';
import { OpenApiMeta } from 'trpc-openapi';
import { getServerCount } from '../../model/serverStatus.js';
import { ROLES, slugRegex } from '@tianji/shared';
import {
  createUserSelect,
  joinWorkspace,
  leaveWorkspace,
} from '../../model/user.js';
import { WorkspacesOnUsersModelSchema } from '../../prisma/zod/workspacesonusers.js';
import { monitorManager } from '../../model/monitor/index.js';

export const workspaceRouter = router({
  create: protectProedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'POST',
        path: '/create',
      })
    )
    .input(
      z.object({
        name: z
          .string()
          .max(60)
          .min(4)
          .regex(slugRegex, { message: 'no a valid name' }),
      })
    )
    .output(userInfoSchema)
    .mutation(async ({ input, ctx }) => {
      const { name } = input;
      const userId = ctx.user.id;

      const existed = await prisma.workspace.findFirst({
        where: {
          name,
        },
      });

      if (existed) {
        throw new Error('This workspace has been existed');
      }

      const userInfo = await prisma.$transaction(async (p) => {
        const newWorkspace = await p.workspace.create({
          data: {
            name,
          },
        });

        return await p.user.update({
          data: {
            currentWorkspaceId: newWorkspace.id,
            workspaces: {
              create: {
                workspaceId: newWorkspace.id,
                role: ROLES.owner,
              },
            },
          },
          where: {
            id: userId,
          },
          select: createUserSelect,
        });
      });

      return userInfo;
    }),
  switch: protectProedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'POST',
        path: '/switch',
      })
    )
    .input(
      z.object({
        workspaceId: z.string(),
      })
    )
    .output(userInfoSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const { workspaceId } = input;

      const targetWorkspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          users: {
            some: {
              userId, // make sure is member of this workspace
            },
          },
        },
      });

      if (!targetWorkspace) {
        throw new Error('Target Workspace not found!');
      }

      const userInfo = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          currentWorkspaceId: targetWorkspace.id,
        },
        select: createUserSelect,
      });

      return userInfo;
    }),
  delete: workspaceOwnerProcedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'DELETE',
        path: '/{workspaceId}',
      })
    )
    .input(
      z.object({
        workspaceId: z.string(),
      })
    )
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      const { workspaceId } = input;
      const userId = ctx.user.id;

      const monitors = await prisma.monitor.findMany({
        where: {
          workspaceId,
        },
        select: {
          id: true,
        },
      });

      await Promise.all(
        monitors.map((m) => monitorManager.delete(workspaceId, m.id))
      );

      await prisma.workspace.delete({
        where: {
          id: workspaceId,
          users: {
            some: {
              userId,
              role: ROLES.owner,
            },
          },
        },
      });
    }),
  members: workspaceProcedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'GET',
        path: '/{workspaceId}/members',
      })
    )
    .output(
      z.array(
        WorkspacesOnUsersModelSchema.merge(
          z.object({
            user: z.object({
              username: z.string(),
              nickname: z.string().nullable(),
              email: z.string().nullable(),
              emailVerified: z.date().nullable(),
            }),
          })
        )
      )
    )
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const list = await prisma.workspacesOnUsers.findMany({
        where: {
          workspaceId,
        },
        include: {
          user: {
            select: {
              username: true,
              nickname: true,
              email: true,
              emailVerified: true,
            },
          },
        },
      });

      return list;
    }),
  invite: workspaceOwnerProcedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'POST',
        path: '/{workspaceId}/invite',
      })
    )
    .input(
      z.object({
        emailOrId: z.string(),
      })
    )
    .output(z.void())
    .mutation(async ({ input }) => {
      const { emailOrId, workspaceId } = input;
      const targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            {
              email: emailOrId,
            },
            {
              id: emailOrId,
            },
          ],
        },
      });

      if (targetUser) {
        // if user exist
        await joinWorkspace(targetUser.id, workspaceId);
      } else {
        // user not exist
        throw new Error('Target user not existed');
      }
    }),
  tick: workspaceOwnerProcedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'DELETE',
        path: '/{workspaceId}/tick',
        description: 'Administrator kicks a user out of a workspace.',
      })
    )
    .input(
      z.object({
        targetUserId: z.string(),
      })
    )
    .output(z.void())
    .mutation(async ({ input }) => {
      const { targetUserId, workspaceId } = input;

      leaveWorkspace(targetUserId, workspaceId);
    }),
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
        path: '/{workspaceId}/getServiceCount',
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
        feed: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const [website, monitor, telemetry, page, survey, feed] =
        await Promise.all([
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
          prisma.feedChannel.count({
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
        feed,
      };
    }),
  /**
   * @deprecated
   */
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
  /**
   * @deprecated
   */
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
      path: `/workspace/${meta.path}`,
    },
  };
}
