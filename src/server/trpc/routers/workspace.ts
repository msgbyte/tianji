import {
  OpenApiMetaInfo,
  protectProedure,
  publicProcedure,
  router,
  workspaceAdminProcedure,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { z } from 'zod';
import { prisma } from '../../model/_client.js';
import {
  userInfoSchema,
  workspaceDashboardLayoutSchema,
  workspaceSchema,
} from '../../model/_schema/index.js';
import { Prisma } from '@prisma/client';
import { OPENAPI_TAG } from '../../utils/const.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import { getServerCount } from '../../model/serverStatus.js';
import { ROLES, slugRegex } from '@tianji/shared';
import {
  createUserSelect,
  joinWorkspace,
  leaveWorkspace,
} from '../../model/user.js';
import { WorkspacesOnUsersModelSchema } from '../../prisma/zod/workspacesonusers.js';
import { monitorManager } from '../../model/monitor/index.js';
import { get, merge } from 'lodash-es';
import { promWorkspaceCounter } from '../../utils/prometheus/client.js';
import { getWorkspaceServiceCount } from '../../model/workspace.js';
import {
  acceptInvitation,
  createWorkspaceInvitation,
  sendInvitationEmail,
} from '../../model/invitation.js';

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
        name: z.string().max(60).min(4),
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

        promWorkspaceCounter.inc();

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
  rename: workspaceOwnerProcedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'PATCH',
        path: '/rename',
      })
    )
    .input(
      z.object({
        name: z.string().max(60).min(4),
      })
    )
    .output(workspaceSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, name } = input;

      const workspace = await prisma.workspace.update({
        where: {
          id: workspaceId,
        },
        data: {
          name,
        },
      });

      return workspace;
    }),
  delete: workspaceOwnerProcedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'DELETE',
        path: '/{workspaceId}/del',
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
  updateSettings: workspaceAdminProcedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'POST',
        path: '/{workspaceId}/updateSettings',
      })
    )
    .input(
      z.object({
        settings: z.object({}).passthrough(),
      })
    )
    .output(workspaceSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, settings } = input;

      const prev = await prisma.workspace.findUniqueOrThrow({
        where: {
          id: workspaceId,
        },
        select: {
          settings: true,
        },
      });

      const res = await prisma.workspace.update({
        where: {
          id: workspaceId,
        },
        data: {
          settings: merge({}, prev.settings, settings),
        },
      });

      if (
        'timezone' in settings &&
        get(prev, ['settings', 'timezone']) !== settings.timezone
      ) {
        // should be restart all monitor
        monitorManager.restartWithWorkspaceId(workspaceId);
      }

      return res;
    }),
  invite: workspaceAdminProcedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'POST',
        path: '/{workspaceId}/invite',
      })
    )
    .input(
      z.object({
        emailOrId: z.string(),
        role: z.enum([ROLES.admin, ROLES.readOnly]).default(ROLES.readOnly),
      })
    )
    .output(z.void())
    .mutation(async ({ ctx, input }) => {
      const { emailOrId, workspaceId } = input;
      const userId = ctx.user.id;
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

      if (input.role === ROLES.admin) {
        // Need to check if the user is the owner of the workspace
        const userWorkspace = await prisma.workspacesOnUsers.findUnique({
          where: {
            userId_workspaceId: {
              userId: userId,
              workspaceId: input.workspaceId,
            },
          },
        });

        if (userWorkspace?.role !== ROLES.owner) {
          throw new Error(
            'You do not have permission to invite members to this workspace'
          );
        }
      }

      if (targetUser) {
        // if user exist
        await joinWorkspace(targetUser.id, workspaceId);
      } else if (emailOrId.includes('@')) {
        // user not exist, and is email invite user with send email
        const invitation = await createWorkspaceInvitation(
          input.workspaceId,
          userId,
          emailOrId,
          input.role
        );

        const baseUrl = `${ctx.req.protocol}://${ctx.req.get('host')}`;
        await sendInvitationEmail(invitation.id, baseUrl);
      } else {
        throw new Error('Target user not existed');
      }
    }),
  // Accept invitation
  acceptInvitation: protectProedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return acceptInvitation(input.token, ctx.user.id);
    }),

  // Get invitation info (no login required)
  getInvitationInfo: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const invitation = await prisma.workspaceInvitation.findUnique({
        where: {
          token: input.token,
        },
        select: {
          email: true,
          expiresAt: true,
          status: true,
          workspace: {
            select: {
              name: true,
            },
          },
          inviter: {
            select: {
              username: true,
              nickname: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new Error('Invitation does not exist');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Invitation has been processed');
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      return {
        email: invitation.email,
        workspace: invitation.workspace.name,
        inviter: invitation.inviter.nickname || invitation.inviter.username,
        expiresAt: invitation.expiresAt,
      };
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

  updateMemberRole: workspaceOwnerProcedure
    .meta(
      buildWorkspaceOpenapi({
        method: 'PATCH',
        path: '/{workspaceId}/updateMemberRole',
        description: 'Update workspace member role',
      })
    )
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(ROLES),
      })
    )
    .output(z.void())
    .mutation(async ({ input }) => {
      const { userId, workspaceId, role } = input;

      const member = await prisma.workspacesOnUsers.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
      });

      if (!member) {
        throw new Error('Member not found');
      }

      if (member.role === ROLES.owner) {
        throw new Error("Cannot change owner's role");
      }

      await prisma.workspacesOnUsers.update({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
        data: {
          role,
        },
      });
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
        application: z.number(),
        monitor: z.number(),
        server: z.number(),
        telemetry: z.number(),
        page: z.number(),
        survey: z.number(),
        feed: z.number(),
        aiGateway: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const {
        website,
        application,
        monitor,
        telemetry,
        page,
        survey,
        feed,
        aiGateway,
      } = await getWorkspaceServiceCount(workspaceId);

      const server = getServerCount(workspaceId);

      return {
        website,
        application,
        monitor,
        server,
        telemetry,
        page,
        survey,
        feed,
        aiGateway,
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
      path: `/workspace${meta.path}`,
    },
  };
}
