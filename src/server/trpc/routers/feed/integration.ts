import { z } from 'zod';
import { OpenApiMetaInfo, publicProcedure, router } from '../../trpc';
import { prisma } from '../../../model/_client';
import _ from 'lodash';
import { subscribeEventBus } from '../../../ws/shared';
import { OpenApiMeta } from 'trpc-openapi';
import { OPENAPI_TAG } from '../../../utils/const';
import { serializeJSON } from '../../../utils/json';

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
        subscribeEventBus.emit(
          'onReceiveFeedEvent',
          workspaceId,
          serializeJSON(event)
        );

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
        subscribeEventBus.emit(
          'onReceiveFeedEvent',
          workspaceId,
          serializeJSON(event)
        );

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
          subscribeEventBus.emit(
            'onReceiveFeedEvent',
            workspaceId,
            serializeJSON(event)
          );

          return 'ok';
        }
      }

      return 'not supported';
    }),
});

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
