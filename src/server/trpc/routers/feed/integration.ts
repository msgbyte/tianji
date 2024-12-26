import { z } from 'zod';
import { OpenApiMetaInfo, publicProcedure, router } from '../../trpc.js';
import { prisma } from '../../../model/_client.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import { OPENAPI_TAG } from '../../../utils/const.js';
import { createFeedEvent } from '../../../model/feed/event.js';
import { tencentCloudAlarmSchema } from '../../../model/_schema/feed.js';
import { logger } from '../../../utils/logger.js';
import { compact, fromPairs, get, map, uniqueId } from 'lodash-es';
import { subscribeEventBus } from '../../../ws/shared.js';
import { currencyToSymbol } from 'easy-currency-symbol';

export const feedIntegrationRouter = router({
  playground: publicProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'POST',
        path: '/playground/{workspaceId}',
        summary: 'webhook playground',
      })
    )
    .input(
      z
        .object({
          workspaceId: z.string(),
        })
        .passthrough()
    )
    .output(z.string())
    .mutation(async ({ input, ctx }) => {
      const headers = ctx.req.headers;
      const body = ctx.req.body;
      const method = ctx.req.method;
      const url = ctx.req.originalUrl;
      const workspaceId = input.workspaceId;

      subscribeEventBus.emit('onReceivePlaygroundWebhookRequest', workspaceId, {
        id: uniqueId('req#'),
        headers,
        body,
        method,
        url,
        createdAt: Date.now(),
      });

      return 'success';
    }),
  github: publicProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'POST',
        path: '/{channelId}/github',
        summary: 'integrate with github webhook',
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
        throw new Error('Not found Workspace');
      }

      if (eventType === 'push') {
        const pusherName = get(data, 'pusher.name');
        const pusherEmail = get(data, 'pusher.email');
        const commits = map(get(data, 'commits') as any[], (val) =>
          String(val.id).substring(0, 9)
        ).join(', ');
        const fullName = get(data, 'repository.full_name');
        const repoUrl = get(data, 'repository.html_url');
        const ref = String(get(data, 'ref'));
        const senderId = String(get(data, 'sender.id'));
        const senderName = String(get(data, 'sender.login'));
        const url = String(get(data, 'compare'));

        await createFeedEvent(workspaceId, {
          channelId: channelId,
          eventName: eventType,
          eventContent: `[${pusherName}](mailto:${pusherEmail}) push commit ${commits ? `**${commits}**` : ''} to **${ref}** in [${fullName}](${repoUrl})`,
          tags: [],
          source: 'github',
          senderId,
          senderName,
          important: false,
          url,
          payload: data,
        });

        return 'ok';
      } else if (eventType === 'star') {
        const starCount = get(data, 'repository.stargazers_count');
        const fullName = get(data, 'repository.full_name');
        const repoUrl = get(data, 'repository.html_url');
        const senderId = String(get(data, 'sender.id'));
        const senderName = String(get(data, 'sender.login'));
        const senderUrl = String(get(data, 'sender.html_url'));
        const url = String(get(data, 'compare'));
        const action = String(get(data, 'action'));

        if (action === 'created') {
          await createFeedEvent(workspaceId, {
            channelId: channelId,
            eventName: eventType,
            eventContent: `[${senderName}](${senderUrl}) star repo [${fullName}](${repoUrl}), now is ${starCount}.`,
            tags: [],
            source: 'github',
            senderId,
            senderName,
            important: false,
            url,
            payload: data,
          });
        } else if (action === 'deleted') {
          await createFeedEvent(workspaceId, {
            channelId: channelId,
            eventName: eventType,
            eventContent: `[${senderName}](${senderUrl}) unstar repo [${fullName}](${repoUrl}), now is ${starCount}.`,
            tags: [],
            source: 'github',
            senderId,
            senderName,
            important: false,
            url,
            payload: data,
          });
        }

        return 'ok';
      } else if (eventType === 'issues') {
        const action = get(data, 'action') as 'opened' | 'closed';
        const fullName = get(data, 'repository.full_name');
        const repoUrl = get(data, 'repository.html_url');
        const senderId = String(get(data, 'sender.id'));
        const senderName = String(get(data, 'sender.login'));
        const url = String(get(data, 'issue.url'));
        const title = String(get(data, 'issue.title'));

        let eventName = eventType;
        let eventContent = '';
        if (action === 'opened') {
          eventName = 'open_issue';
          eventContent = `${senderName} open issue [${title}] in repo [${fullName}](${repoUrl})`;
        } else if (action === 'closed') {
          eventName = 'close_issue';
          eventContent = `${senderName} close issue [${title}] in repo [${fullName}](${repoUrl})`;
        }

        if (eventContent) {
          await createFeedEvent(workspaceId, {
            channelId: channelId,
            eventName,
            eventContent,
            tags: [],
            source: 'github',
            senderId,
            senderName,
            important: false,
            url,
            payload: data,
          });

          return 'ok';
        }
      }

      logUnknownIntegration('github', input);

      return 'Not supported yet';
    }),
  stripe: publicProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'POST',
        path: '/{channelId}/stripe',
        summary: 'integrate with stripe webhook',
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
      console.log(input);
      const { channelId, ...data } = input;
      const type = data.type;

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
        throw new Error('Not found Workspace');
      }

      if (type === 'payment_intent.succeeded') {
        const amount = get(data, 'data.object.amount_received');
        const currency = String(
          get(data, 'data.object.currency')
        ).toUpperCase();
        const eventId = String(get(data, 'data.id')).toUpperCase();

        await createFeedEvent(workspaceId, {
          channelId: channelId,
          eventName: type,
          eventContent: `You **receive** a payment of ${currencyToSymbol(currency)}**${Number(amount) / 100}**`,
          tags: [],
          source: 'stripe',
          senderId: eventId,
          important: true,
          payload: data,
        });
        return 'ok';
      }

      if (type === 'payment_intent.canceled') {
        const amount = get(data, 'data.object.amount');
        const currency = String(
          get(data, 'data.object.currency')
        ).toUpperCase();
        const eventId = String(get(data, 'data.id')).toUpperCase();

        await createFeedEvent(workspaceId, {
          channelId: channelId,
          eventName: type,
          eventContent: `A payment has been **canceled** of ${currencyToSymbol(currency)}**${Number(amount) / 100}**`,
          tags: [],
          source: 'stripe',
          senderId: eventId,
          important: false,
          payload: data,
        });
        return 'ok';
      }

      if (type === 'customer.subscription.created') {
        const eventId = String(get(data, 'data.id')).toUpperCase();
        const planName = get(data, 'data.object.plan.nickname');

        await createFeedEvent(workspaceId, {
          channelId: channelId,
          eventName: type,
          eventContent: `A customer has been subscribed service: **${planName}**`,
          tags: [],
          source: 'stripe',
          senderId: eventId,
          important: true,
          payload: data,
        });
        return 'ok';
      }

      if (type === 'customer.subscription.deleted') {
        const eventId = String(get(data, 'data.id')).toUpperCase();
        const planName = get(data, 'data.object.plan.nickname');

        await createFeedEvent(workspaceId, {
          channelId: channelId,
          eventName: type,
          eventContent: `A customer cancel subscription service: ${planName}`,
          tags: [],
          source: 'stripe',
          senderId: eventId,
          important: true,
          payload: data,
        });

        return 'ok';
      }

      logUnknownIntegration('stripe', input);

      return 'Not supported yet';
    }),
  tencentCloudAlarm: publicProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'POST',
        path: '/{channelId}/tencent-cloud/alarm',
        summary: 'integrate with tencent-cloud webhook',
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
        throw new Error('Not found Workspace');
      }

      const res = tencentCloudAlarmSchema.safeParse(data);
      if (!res.success) {
        logger.error(
          '[TencentCloudAlarm] input parse error:',
          res.error,
          ' | input:',
          data
        );
        throw new Error('Input not valid,' + JSON.stringify(res.error));
      }

      const alarm = res.data;

      if (alarm.alarmType === 'event') {
        const conditions = alarm.alarmPolicyInfo.conditions;

        await createFeedEvent(workspaceId, {
          channelId: channelId,
          eventName: alarm.alarmType,
          eventContent: `[${alarm.alarmStatus === '1' ? 'Trigger' : 'Recover'}] **${alarm.alarmObjInfo.dimensions.unInstanceId}** ${alarm.alarmPolicyInfo.policyName} ${conditions.productShowName} ${conditions.eventShowName}.`,
          tags: [
            alarm.alarmObjInfo.appId,
            alarm.alarmObjInfo.dimensions.unInstanceId,
          ],
          source: 'tencent-cloud',
          senderId: alarm.alarmObjInfo.appId,
          senderName: alarm.alarmPolicyInfo.policyName,
          important: alarm.alarmStatus === '1',
          payload: data,
        });

        return 'ok';
      }

      if (alarm.alarmType === 'metric') {
        const conditions = alarm.alarmPolicyInfo.conditions;

        await createFeedEvent(workspaceId, {
          channelId: channelId,
          eventName: alarm.alarmType,
          eventContent: `[${alarm.alarmStatus === '1' ? 'Trigger' : 'Recover'}] **${alarm.alarmObjInfo.dimensions.unInstanceId}** ${alarm.alarmPolicyInfo.policyName} ${conditions.metricShowName} ${conditions.calcType} ${conditions.calcValue}${conditions.calcUnit} (current: ${conditions.currentValue}${conditions.unit}) [${alarm.firstOccurTime} - ${alarm.durationTime}](keep: ${alarm.durationTime}s).`,
          tags: [
            alarm.alarmObjInfo.appId,
            alarm.alarmObjInfo.dimensions.unInstanceId,
            ...(alarm.alarmPolicyInfo.tag ?? []).map(String),
          ],
          source: 'tencent-cloud',
          senderId: alarm.alarmObjInfo.appId,
          senderName: alarm.alarmPolicyInfo.policyName,
          important: alarm.alarmStatus === '1',
          payload: data,
        });

        return 'ok';
      }

      logUnknownIntegration('tencentCloudAlarm', input);

      return 'Not supported yet';
    }),
  sentry: publicProcedure
    .meta(
      buildFeedPublicOpenapi({
        method: 'POST',
        path: '/{channelId}/sentry',
        summary: 'integrate with sentry webhook',
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
      const { channelId, ...data } = input;
      const eventType = ctx.req.headers['sentry-hook-resource'];

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
        throw new Error('Not found Workspace');
      }

      const action = get(data, 'action');

      if (eventType === 'event_alert' && action === 'triggered') {
        const title = get(data, 'data.event.title');
        const message = get(data, 'data.event.message');
        const tags = fromPairs<string>(get(data as any, 'data.event.tags'));
        const url = String(get(data, 'data.event.web_url'));
        const senderId = String(get(data, 'data.actor.id'));
        const senderName = String(get(data, 'data.actor.name'));

        await createFeedEvent(workspaceId, {
          channelId: channelId,
          eventName: 'alert',
          eventContent: `${title} | ${message}`,
          tags: compact([
            tags['environment'],
            tags['release'],
            tags['browser'],
            tags['os'],
            tags['device'],
          ]),
          source: 'sentry',
          senderId,
          senderName,
          important: false,
          url,
        });

        return 'ok';
      }

      // sentry payload is toooo large, its not good to print it at all
      // logUnknownIntegration('sentry', input);

      return 'Not supported yet';
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

function logUnknownIntegration(source: string, input: any) {
  logger.info(`[Feed Unknown Integration] ${source}: ${JSON.stringify(input)}`);
}
