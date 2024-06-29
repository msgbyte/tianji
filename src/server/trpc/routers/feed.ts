import { z } from 'zod';
import {
  OpenApiMetaInfo,
  publicProcedure,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc';
import { OPENAPI_TAG } from '../../utils/const';
import { OpenApiMeta } from 'trpc-openapi';
import { FeedChannelModelSchema, FeedEventModelSchema } from '../../prisma/zod';
import { prisma } from '../../model/_client';
import _ from 'lodash';
import { subscribeEventBus } from '../../ws/shared';

export const feedIntegrationRouter = router({
  github: publicProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'POST',
        path: '/{channelId}/github',
      })
    )
    .input(
      z
        .object({
          channelId: z.string(),
        })
        .passthrough()
    )
    .output(z.string())
    .mutation(async ({ input, ctx }) => {
      const eventType = ctx.req.headers['x-github-event'];
      const { channelId, ...data } = input;

      const workspaceId = await prisma.feedChannel
        .findFirst({
          where: {
            id: channelId,
          },
          select: {
            workspaceId: true,
          },
        })
        .then((res) => res?.workspaceId);

      if (!workspaceId) {
        return 'Not found';
      }

      if (eventType === 'push') {
        const pusher = `${_.get(data, 'pusher.name')}<${_.get(data, 'pusher.email')}>`;
        const commits = _.map(_.get(data, 'commits') as any[], 'id').join(', ');
        const fullName = _.get(data, 'repository.full_name');
        const ref = String(_.get(data, 'ref'));
        const senderId = String(_.get(data, 'sender.id'));
        const senderName = String(_.get(data, 'sender.login'));
        const url = String(_.get(data, 'compare'));
        const event = await prisma.feedEvent.create({
          data: {
            channelId: channelId,
            eventName: eventType,
            eventContent: `${pusher} push commit ${commits} to [${ref}] in ${fullName}`,
            tags: [],
            source: 'github',
            senderId,
            senderName,
            important: false,
            url,
          },
        });
        subscribeEventBus.emit('onReceiveFeedEvent', workspaceId, event);

        return 'ok';
      } else if (eventType === 'star') {
        const starCount = _.get(data, 'repository.stargazers_count');
        const fullName = _.get(data, 'repository.full_name');
        const senderId = String(_.get(data, 'sender.id'));
        const senderName = String(_.get(data, 'sender.login'));
        const url = String(_.get(data, 'compare'));
        const event = await prisma.feedEvent.create({
          data: {
            channelId: channelId,
            eventName: eventType,
            eventContent: `${senderName} star repo [${fullName}], now is ${starCount}.`,
            tags: [],
            source: 'github',
            senderId,
            senderName,
            important: false,
            url,
          },
        });
        subscribeEventBus.emit('onReceiveFeedEvent', workspaceId, event);

        return 'ok';
      } else if (eventType === 'issues') {
        const action = _.get(data, 'action') as 'opened' | 'closed';
        const starCount = _.get(data, 'repository.stargazers_count');
        const fullName = _.get(data, 'repository.full_name');
        const senderId = String(_.get(data, 'sender.id'));
        const senderName = String(_.get(data, 'sender.login'));
        const url = String(_.get(data, 'issue.url'));
        const title = String(_.get(data, 'issue.title'));

        let eventName = eventType;
        let eventContent = '';
        if (action === 'opened') {
          eventName = 'open_issue';
          eventContent = `${senderName} open issue [${title}] in repo [${fullName}]`;
        } else if (action === 'closed') {
          eventName = 'close_issue';
          eventContent = `${senderName} close issue [${title}] in repo [${fullName}]`;
        }

        if (eventContent) {
          const event = await prisma.feedEvent.create({
            data: {
              channelId: channelId,
              eventName: eventName,
              eventContent: `${senderName} star repo [${fullName}], now is ${starCount}.`,
              tags: [],
              source: 'github',
              senderId,
              senderName,
              important: false,
              url,
            },
          });
          subscribeEventBus.emit('onReceiveFeedEvent', workspaceId, event);

          return 'ok';
        }
      }

      return 'not supported';
    }),
});

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
        take: 50,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return events;
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

function buildFeedPublicOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.FEED],
      protect: false,
      ...meta,
      path: `/feed${meta.path}`,
    },
  };
}
