import {
  FeedChannelNotifyFrequency,
  FeedState,
  FeedStateStatus,
  Prisma,
} from '@prisma/client';
import { prisma } from '../_client.js';
import { subscribeEventBus } from '../../ws/shared.js';
import { serializeJSON } from '../../utils/json.js';
import { getFeedEventNotify } from './shared.js';
import { z } from 'zod';
import {
  FeedChannelModelSchema,
  FeedStateModelSchema,
  NotificationModelSchema,
} from '../../prisma/zod/index.js';
import dayjs from 'dayjs';
import { ContentToken, token } from '../notification/token/index.js';
import { compact } from 'lodash-es';
import { sendNotification } from '../notification/index.js';
import { logger } from '../../utils/logger.js';

export async function feedStateUpsert(
  workspaceId: string,
  stateData: Prisma.FeedStateCreateArgs['data']
): Promise<z.infer<typeof FeedStateModelSchema>> {
  if (stateData.status === FeedStateStatus.Resolved && !stateData.resolvedAt) {
    stateData.resolvedAt = new Date();
  }

  const state = await prisma.feedState.upsert({
    where: {
      source_eventId: {
        source: stateData.source,
        eventId: stateData.eventId,
      },
    },
    update: stateData,
    create: stateData,
  });

  subscribeEventBus.emit(
    'onReceiveFeedState',
    workspaceId,
    serializeJSON(state)
  );

  if (state.channelId) {
    const channel = await getFeedEventNotify(state.channelId);

    if (channel?.notifyFrequency === FeedChannelNotifyFrequency.event) {
      // send notify every event
      sendFeedStateNotify(channel, [state]);
    }
  }

  return state;
}

export async function feedStateResolve(
  workspaceId: string,
  channelId: string,
  stateId: string
) {
  const state = await prisma.feedState.update({
    where: {
      id: stateId,
      channelId,
    },
    data: {
      status: FeedStateStatus.Resolved,
      resolvedAt: new Date(),
    },
  });

  subscribeEventBus.emit(
    'onReceiveFeedState',
    workspaceId,
    serializeJSON(state)
  );

  if (state.channelId) {
    const channel = await getFeedEventNotify(state.channelId);

    if (channel?.notifyFrequency === FeedChannelNotifyFrequency.event) {
      // send notify every event
      sendFeedStateNotify(channel, [state]);
    }
  }

  return state;
}

export async function sendFeedStateNotify(
  channel: Pick<
    z.infer<typeof FeedChannelModelSchema>,
    'id' | 'name' | 'notifyFrequency'
  > & {
    notifications: z.infer<typeof NotificationModelSchema>[];
  },
  states: FeedState[]
) {
  let frequencyText = 'New State';
  if (channel.notifyFrequency === FeedChannelNotifyFrequency.day) {
    frequencyText = `Daily | ${dayjs().subtract(1, 'day').toISOString()} - ${dayjs().toISOString()}`;
  } else if (channel.notifyFrequency === FeedChannelNotifyFrequency.week) {
    frequencyText = `Weekly | ${dayjs().subtract(1, 'week').toISOString()} - ${dayjs().toISOString()}`;
  } else if (channel.notifyFrequency === FeedChannelNotifyFrequency.month) {
    frequencyText = `Monthly | ${dayjs().subtract(1, 'month').toISOString()} - ${dayjs().toISOString()}`;
  }

  const eventTokens: ContentToken[] = [
    token.list(
      states.map((state) =>
        compact([
          token.text(
            `[${state.source}:${state.eventName}] ${state.eventContent} ${state.status === FeedStateStatus.Ongoing ? '[ongoing]' : `[resolved]`}`
          ),
          state.url && token.url(state.url, '[→]'),
        ])
      )
    ),
  ];

  await Promise.all(
    channel.notifications.map((notification) =>
      sendNotification(
        notification,
        `Feed Report from Channel: ${channel.name} | ${frequencyText}`,
        eventTokens,
        { states }
      ).catch((err) =>
        logger.error(
          '[Notification] sendFeedStateNotify Failed',
          channel.id,
          notification.id,
          err
        )
      )
    )
  );
}
