import { TRPCError } from '@trpc/server';
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';
import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../../trpc.js';
import { OPENAPI_TAG } from '../../../utils/const.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import {
  FeedChannelModelSchema,
  FeedEventModelSchema,
} from '../../../prisma/zod/index.js';
import { prisma } from '../../../model/_client.js';
import {
  buildFeedPublicOpenapi,
  feedIntegrationRouter,
} from './integration.js';
import { fetchDataByCursor } from '../../../utils/prisma.js';
import { delFeedEventNotifyCache } from '../../../model/feed/shared.js';
import { getWorkspaceTierLimit } from '../../../model/billing/limit.js';
import { isWorkspacePaused } from '../../../model/billing/workspace.js';
import { feedStateRouter } from './state.js';

const PublicFeedChannelSchema = FeedChannelModelSchema.pick({
  id: true,
  name: true,
  publicShareId: true,
});

export const feedRouter = router({
  channels: workspaceProcedure
    .meta(
      buildFeedOpenapi({
        method: 'GET',
        path: '/channels',
        summary: 'Get all channels',
      })
    )
    .output(
      z.array(
        FeedChannelModelSchema.merge(
          z.object({
            _count: z.object({
              events: z.number(),
            }),
          })
        )
      )
    )
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const channels = await prisma.feedChannel.findMany({
        where: {
          workspaceId,
        },
        include: {
          _count: {
            select: {
              events: {
                where: {
                  archived: false,
                },
              },
            },
          },
        },
      });

      return channels;
    }),
  channelInfo: workspaceProcedure
    .meta(
      buildFeedOpenapi({
        method: 'GET',
        path: '/{channelId}/info',
        summary: 'Get channel info',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .output(
      z
        .object({
          notificationIds: z.array(z.string()),
        })
        .merge(FeedChannelModelSchema)
        .nullable()
    )
    .query(async ({ input }) => {
      const { channelId, workspaceId } = input;

      const channel = await prisma.feedChannel.findFirst({
        where: {
          workspaceId,
          id: channelId,
        },
        include: {
          notifications: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!channel) {
        return null;
      }

      return {
        ...channel,
        notificationIds: channel?.notifications.map((n) => n.id),
      };
    }),
  updateChannelInfo: workspaceProcedure
    .meta(
      buildFeedOpenapi({
        method: 'POST',
        path: '/{channelId}/update',
        summary: 'Update channel',
      })
    )
    .input(
      z
        .object({
          channelId: z.string(),
          notificationIds: z.array(z.string()).default([]),
        })
        .merge(
          FeedChannelModelSchema.pick({
            name: true,
            webhookSignature: true,
            notifyFrequency: true,
          })
        )
    )
    .output(
      z
        .object({
          notificationIds: z.array(z.string()),
        })
        .merge(FeedChannelModelSchema)
        .nullable()
    )
    .mutation(async ({ input }) => {
      const {
        channelId,
        workspaceId,
        name,
        webhookSignature,
        notifyFrequency,
        notificationIds,
      } = input;

      const channel = await prisma.feedChannel.update({
        where: {
          workspaceId,
          id: channelId,
        },
        data: {
          name,
          webhookSignature,
          notifyFrequency,
          notifications: {
            set: notificationIds.map((id) => ({
              id,
            })),
          },
        },
      });

      delFeedEventNotifyCache(channelId);

      if (!channel) {
        return null;
      }

      return { ...channel, notificationIds };
    }),
  fetchEventsByCursor: workspaceProcedure
    .meta(
      buildFeedOpenapi({
        method: 'GET',
        path: '/{channelId}/fetchEventsByCursor',
        summary: 'Fetch events',
        description: 'Fetch workspace feed channel events',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        archived: z.boolean().default(false),
      })
    )
    .output(
      z.object({
        items: z.array(FeedEventModelSchema),
        nextCursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { channelId, cursor, limit, archived } = input;

      const { items, nextCursor } = await fetchDataByCursor(prisma.feedEvent, {
        where: {
          channelId,
          archived,
        },
        select: {
          id: true,
          channelId: true,
          createdAt: true,
          updatedAt: true,
          eventName: true,
          eventContent: true,
          tags: true,
          source: true,
          senderId: true,
          senderName: true,
          url: true,
          important: true,
          archived: true,
        },
        limit,
        cursor,
      });

      return {
        items,
        nextCursor,
      };
    }),
  fetchPublicEventsByCursor: publicProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'GET',
        path: '/public/{shareId}/events',
        description: 'Fetch public feed channel events by shareId',
      })
    )
    .input(
      z.object({
        shareId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .output(
      z.object({
        items: z.array(FeedEventModelSchema),
        nextCursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { shareId, limit, cursor } = input;

      const channel = await prisma.feedChannel.findFirst({
        where: {
          publicShareId: shareId,
        },
      });

      if (!channel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found',
        });
      }

      const { items, nextCursor } = await fetchDataByCursor(prisma.feedEvent, {
        where: {
          channelId: channel.id,
          archived: false,
        },
        select: {
          id: true,
          channelId: true,
          createdAt: true,
          updatedAt: true,
          eventName: true,
          eventContent: true,
          tags: true,
          source: true,
          senderId: true,
          senderName: true,
          url: true,
          important: true,
          archived: true,
        },
        limit,
        cursor,
      });

      return {
        items,
        nextCursor,
      };
    }),
  getChannelByShareId: publicProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'GET',
        path: '/public/{shareId}/info',
        description: 'Fetch public feed channel info by shareId',
      })
    )
    .input(
      z.object({
        shareId: z.string(),
      })
    )
    .output(PublicFeedChannelSchema)
    .query(async ({ input }) => {
      const { shareId } = input;

      const channel = await prisma.feedChannel.findFirst({
        where: {
          publicShareId: shareId,
        },
        select: {
          id: true,
          name: true,
          publicShareId: true,
        },
      });

      if (!channel?.publicShareId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found',
        });
      }

      return channel;
    }),
  createChannel: workspaceAdminProcedure
    .meta(
      buildFeedOpenapi({
        method: 'POST',
        path: '/createChannel',
        summary: 'Create channel',
      })
    )
    .input(
      FeedChannelModelSchema.pick({
        name: true,
        notifyFrequency: true,
      }).merge(
        z.object({
          notificationIds: z.array(z.string()).default([]),
        })
      )
    )
    .output(
      z
        .object({
          notificationIds: z.array(z.string()),
        })
        .merge(FeedChannelModelSchema)
    )
    .mutation(async ({ input }) => {
      const { name, workspaceId, notifyFrequency, notificationIds } = input;

      const [limit, feedChannelCount] = await Promise.all([
        getWorkspaceTierLimit(workspaceId),
        prisma.feedChannel.count({
          where: {
            workspaceId,
          },
        }),
      ]);
      if (
        limit.maxFeedChannelCount !== -1 &&
        feedChannelCount >= limit.maxFeedChannelCount
      ) {
        throw new Error('You have reached your website limit');
      }

      const channel = await prisma.feedChannel.create({
        data: {
          workspaceId,
          name,
          notifyFrequency,
          publicShareId: createId(),
          notifications: {
            connect: notificationIds.map((id) => ({ id })),
          },
        },
        include: {
          notifications: {
            select: {
              id: true,
            },
          },
        },
      });

      return {
        ...channel,
        notificationIds: channel?.notifications.map((n) => n.id),
      };
    }),
  refreshPublicShareId: workspaceAdminProcedure
    .meta(
      buildFeedOpenapi({
        method: 'POST',
        path: '/{channelId}/refreshPublicShare',
        summary: 'Refresh public share',
        description: 'Regenerate public share id for feed channel',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .output(
      z.object({
        publicShareId: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { channelId, workspaceId } = input;

      const channel = await prisma.feedChannel.update({
        where: {
          workspaceId,
          id: channelId,
        },
        data: {
          publicShareId: createId(),
        },
        select: {
          publicShareId: true,
        },
      });

      return channel;
    }),
  disablePublicShareId: workspaceAdminProcedure
    .meta(
      buildFeedOpenapi({
        method: 'POST',
        path: '/{channelId}/disablePublicShare',
        summary: 'Disable public share',
        description: 'Disable public share for feed channel',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .output(
      z.object({
        publicShareId: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { channelId, workspaceId } = input;

      const channel = await prisma.feedChannel.update({
        where: {
          workspaceId,
          id: channelId,
        },
        data: {
          publicShareId: null,
        },
        select: {
          publicShareId: true,
        },
      });

      return channel;
    }),
  deleteChannel: workspaceAdminProcedure
    .meta(
      buildFeedOpenapi({
        method: 'DELETE',
        path: '/{channelId}/del',
        summary: 'Delete channel',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .output(FeedChannelModelSchema)
    .mutation(async ({ input }) => {
      const { channelId, workspaceId } = input;

      const channel = await prisma.feedChannel.delete({
        where: {
          workspaceId,
          id: channelId,
        },
      });

      return channel;
    }),
  sendEvent: publicProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'POST',
        path: '/{channelId}/send',
      })
    )
    .input(
      FeedEventModelSchema.pick({
        eventName: true,
        eventContent: true,
        tags: true,
        source: true,
        senderId: true,
        senderName: true,
        important: true,
        payload: true,
      }).merge(
        z.object({
          channelId: z.string(),
        })
      )
    )
    .output(FeedEventModelSchema)
    .mutation(async ({ input, ctx }) => {
      const { channelId, ...data } = input;

      const channel = await prisma.feedChannel.findUnique({
        where: {
          id: channelId,
        },
      });

      if (!channel) {
        throw new Error('Channel not found');
      }

      if (await isWorkspacePaused(channel.workspaceId)) {
        throw new Error('Workspace is paused.');
      }

      if (channel.webhookSignature) {
        const signature = ctx.req.headers['x-webhook-signature'];
        if (!signature) {
          throw new Error(
            'This channel configured with webhook signature, but no signature found'
          );
        }

        if (channel.webhookSignature !== signature) {
          throw new Error('Invalid webhook signature');
        }
      }

      const event = await prisma.feedEvent.create({
        data: {
          ...data,
          channelId: channelId,
        },
      });

      return event as z.infer<typeof FeedEventModelSchema>;
    }),
  archiveEvent: workspaceAdminProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'PATCH',
        path: '/{channelId}/{eventId}/archive',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
        eventId: z.string(),
      })
    )
    .output(z.void())
    .mutation(async ({ input }) => {
      const { channelId, eventId } = input;

      await prisma.feedEvent.update({
        data: {
          archived: true,
        },
        where: {
          id: eventId,
          channelId,
        },
      });
    }),
  unarchiveEvent: workspaceAdminProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'PATCH',
        path: '/{channelId}/{eventId}/unarchive',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
        eventId: z.string(),
      })
    )
    .output(z.void())
    .mutation(async ({ input }) => {
      const { channelId, eventId } = input;

      await prisma.feedEvent.update({
        data: {
          archived: false,
        },
        where: {
          id: eventId,
          channelId,
        },
      });
    }),
  clearAllArchivedEvents: workspaceAdminProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'PATCH',
        path: '/{channelId}/clearAllArchivedEvents',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .output(z.number())
    .mutation(async ({ input }) => {
      const { channelId } = input;

      const res = await prisma.feedEvent.deleteMany({
        where: {
          channelId,
          archived: true,
        },
      });

      return res.count;
    }),
  integration: feedIntegrationRouter,
  state: feedStateRouter,
});

function buildFeedOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.FEED],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}/feed${meta.path}`,
    },
  };
}
