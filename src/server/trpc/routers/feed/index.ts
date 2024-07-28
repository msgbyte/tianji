import { z } from 'zod';
import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../../trpc.js';
import { OPENAPI_TAG } from '../../../utils/const.js';
import { OpenApiMeta } from 'trpc-openapi';
import {
  FeedChannelModelSchema,
  FeedEventModelSchema,
} from '../../../prisma/zod/index.js';
import { prisma } from '../../../model/_client.js';
import _ from 'lodash';
import {
  buildFeedPublicOpenapi,
  feedIntegrationRouter,
} from './integration.js';
import { fetchDataByCursor } from '../../../utils/prisma.js';
import { delFeedEventNotifyCache } from '../../../model/feed/event.js';

export const feedRouter = router({
  channels: workspaceProcedure
    .meta(
      buildFeedOpenapi({
        method: 'GET',
        path: '/channels',
      })
    )
    .input(z.object({}))
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
              events: true,
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
      const { channelId, workspaceId, name, notifyFrequency, notificationIds } =
        input;

      const channel = await prisma.feedChannel.update({
        where: {
          workspaceId,
          id: channelId,
        },
        data: {
          name,
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
        description: 'Fetch workspace feed channel events',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
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
      const { channelId, cursor, limit } = input;

      const { items, nextCursor } = await fetchDataByCursor(prisma.feedEvent, {
        where: {
          channelId,
        },
        limit,
        cursor,
      });

      return {
        items,
        nextCursor,
      };
    }),
  createChannel: workspaceOwnerProcedure
    .meta(
      buildFeedOpenapi({
        method: 'POST',
        path: '/createChannel',
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

      const channel = await prisma.feedChannel.create({
        data: {
          workspaceId,
          name,
          notifyFrequency,
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
  deleteChannel: workspaceOwnerProcedure
    .meta(
      buildFeedOpenapi({
        method: 'DELETE',
        path: '/{channelId}',
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
      }).merge(
        z.object({
          channelId: z.string(),
        })
      )
    )
    .output(FeedEventModelSchema)
    .mutation(async ({ input }) => {
      const { channelId, ...data } = input;

      const event = await prisma.feedEvent.create({
        data: {
          ...data,
          channelId: channelId,
        },
      });

      return event;
    }),
  integration: feedIntegrationRouter,
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
