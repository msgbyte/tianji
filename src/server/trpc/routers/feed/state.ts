import { z } from 'zod';
import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceProcedure,
} from '../../trpc.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import { OPENAPI_TAG } from '../../../utils/const.js';
import { FeedStateModelSchema } from '../../../prisma/zod/feedstate.js';
import { prisma } from '../../../model/_client.js';
import { isWorkspacePaused } from '../../../model/billing/workspace.js';
import {
  feedStateResolve,
  feedStateUpsert,
} from '../../../model/feed/state.js';
import { FeedStateStatus } from '@prisma/client';

export const feedStateRouter = router({
  all: workspaceProcedure
    .meta(
      buildFeedOpenapi({
        method: 'GET',
        path: '/state/all',
        summary: 'Get all states',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
        limit: z.number().default(5),
      })
    )
    .output(FeedStateModelSchema.array())
    .query(async ({ input }) => {
      const { channelId, limit } = input;

      const states = await prisma.feedState.findMany({
        where: {
          channelId,
          status: FeedStateStatus.Ongoing,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
      });

      return states;
    }),
  upsert: publicProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'POST',
        path: '/{channelId}/state/upsert',
      })
    )
    .input(
      FeedStateModelSchema.pick({
        eventId: true,
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
    .output(FeedStateModelSchema)
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

      const workspaceId = channel.workspaceId;

      const state = await feedStateUpsert(workspaceId, {
        ...data,
        channelId: channelId,
      });

      return state;
    }),
  resolve: workspaceProcedure
    .meta(
      buildFeedOpenapi({
        method: 'POST',
        path: '/{channelId}/state/resolve',
        summary: 'Resolve state',
      })
    )
    .input(
      z.object({
        channelId: z.string(),
        stateId: z.string(),
      })
    )
    .output(FeedStateModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, channelId, stateId } = input;

      const state = await feedStateResolve(workspaceId, channelId, stateId);

      return state;
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

export function buildFeedPublicOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.FEED],
      protect: false,
      ...meta,
      path: `/feed${meta.path}`,
    },
  };
}
