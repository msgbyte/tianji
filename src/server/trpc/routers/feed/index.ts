import { z } from 'zod';
import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../../trpc';
import { OPENAPI_TAG } from '../../../utils/const';
import { OpenApiMeta } from 'trpc-openapi';
import {
  FeedChannelModelSchema,
  FeedEventModelSchema,
} from '../../../prisma/zod';
import { prisma } from '../../../model/_client';
import _ from 'lodash';
import { buildFeedPublicOpenapi, feedIntegrationRouter } from './integration';
import { fetchDataByCursor } from '../../../utils/prisma';

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
    .output(FeedChannelModelSchema.nullable())
    .query(async ({ input }) => {
      const { channelId, workspaceId } = input;

      const channel = prisma.feedChannel.findFirst({
        where: {
          workspaceId,
          id: channelId,
        },
      });

      return channel;
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
        })
        .merge(
          FeedChannelModelSchema.pick({
            name: true,
          })
        )
    )
    .output(FeedChannelModelSchema.nullable())
    .mutation(async ({ input }) => {
      const { channelId, workspaceId, name } = input;

      const channel = prisma.feedChannel.update({
        where: {
          workspaceId,
          id: channelId,
        },
        data: {
          name,
        },
      });

      return channel;
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
      })
    )
    .output(FeedChannelModelSchema)
    .mutation(async ({ input }) => {
      const { name, workspaceId } = input;

      const channel = await prisma.feedChannel.create({
        data: {
          workspaceId,
          name,
        },
      });

      return channel;
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
