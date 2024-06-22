import { z } from 'zod';
import { OpenApiMetaInfo, router, workspaceProcedure } from '../trpc';
import { OPENAPI_TAG } from '../../utils/const';
import { OpenApiMeta } from 'trpc-openapi';
import { FeedChannelModelSchema, FeedEventModelSchema } from '../../prisma/zod';
import { prisma } from '../../model/_client';

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
  events: workspaceProcedure
    .meta(
      buildFeedOpenapi({
        method: 'GET',
        path: '/{channelId}/events',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
      })
    )
    .output(z.array(FeedEventModelSchema))
    .query(async ({ input }) => {
      const { channelId } = input;

      const events = await prisma.feedEvent.findMany({
        where: {
          channelId: channelId,
        },
      });

      return events;
    }),
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
