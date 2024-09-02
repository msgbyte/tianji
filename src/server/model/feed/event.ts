import { FeedChannelNotifyFrequency, FeedEvent, Prisma } from '@prisma/client';
import { subscribeEventBus } from '../../ws/shared.js';
import { prisma } from '../_client.js';
import { serializeJSON } from '../../utils/json.js';
import { buildQueryWithCache } from '../../cache/index.js';
import { sendNotification } from '../notification/index.js';
import { ContentToken, token } from '../notification/token/index.js';
import { logger } from '../../utils/logger.js';
import {
  FeedChannelModelSchema,
  NotificationModelSchema,
} from '../../prisma/zod/index.js';
import dayjs from 'dayjs';
import { z } from 'zod';

const { get: getFeedEventNotify, del: delFeedEventNotifyCache } =
  buildQueryWithCache(async (channelId: string) => {
    const channel = await prisma.feedChannel.findFirst({
      where: {
        id: channelId,
      },
      include: {
        notifications: true,
      },
    });

    if (!channel) {
      return null;
    }

    return channel;
  });

export { delFeedEventNotifyCache };

/**
 * create feed event
 */
export async function createFeedEvent(
  workspaceId: string,
  eventData: Prisma.FeedEventCreateArgs['data']
) {
  const event = await prisma.feedEvent.create({
    data: eventData,
  });
  subscribeEventBus.emit(
    'onReceiveFeedEvent',
    workspaceId,
    serializeJSON(event)
  );

  if (event.channelId) {
    const channel = await getFeedEventNotify(event.channelId);

    if (channel?.notifyFrequency === FeedChannelNotifyFrequency.event) {
      // send notify every event
      sendFeedEventsNotify(channel, [event]);
    }
  }
}

export async function sendFeedEventsNotify(
  channel: Pick<
    z.infer<typeof FeedChannelModelSchema>,
    'id' | 'name' | 'notifyFrequency'
  > & {
    notifications: z.infer<typeof NotificationModelSchema>[];
  },
  events: FeedEvent[]
) {
  let frequencyText = 'Single Event';
  if (channel.notifyFrequency === FeedChannelNotifyFrequency.day) {
    frequencyText = `Daily | ${dayjs().subtract(1, 'day').toISOString()} - ${dayjs().toISOString()}`;
  } else if (channel.notifyFrequency === FeedChannelNotifyFrequency.week) {
    frequencyText = `Weekly | ${dayjs().subtract(1, 'week').toISOString()} - ${dayjs().toISOString()}`;
  } else if (channel.notifyFrequency === FeedChannelNotifyFrequency.month) {
    frequencyText = `Monthly | ${dayjs().subtract(1, 'month').toISOString()} - ${dayjs().toISOString()}`;
  }

  const eventTokens: ContentToken[] = [
    token.list(
      events.map((event) =>
        token.text(
          `[${event.source}:${event.eventName}] ${event.senderName ?? ''}: ${event.eventContent}`
        )
      )
    ),
  ];

  await Promise.all(
    channel.notifications.map((notification) =>
      sendNotification(
        notification,
        `Feed Report from Channel: ${channel.name} | ${frequencyText}`,
        eventTokens
      ).catch((err) =>
        logger.error(
          '[Notification] sendFeedEventsNotify',
          channel.id,
          notification.id,
          err
        )
      )
    )
  );
}
