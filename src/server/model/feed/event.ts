import { FeedChannelNotifyFrequency, FeedEvent, Prisma } from '@prisma/client';
import { subscribeEventBus } from '../../ws/shared';
import { prisma } from '../_client';
import { serializeJSON } from '../../utils/json';
import { buildQueryWithCache } from '../../cache';
import { sendNotification } from '../notification';
import { ContentToken, token } from '../notification/token';
import { logger } from '../../utils/logger';
import {
  FeedChannelModelSchema,
  NotificationModelSchema,
} from '../../prisma/zod';
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
  let frequencyToken = token.paragraph('Range: Every Event');
  if (channel.notifyFrequency === FeedChannelNotifyFrequency.day) {
    frequencyToken = token.paragraph(
      `Range: Daily | ${dayjs().subtract(1, 'day').toISOString()} - ${dayjs().toISOString()}`
    );
  } else if (channel.notifyFrequency === FeedChannelNotifyFrequency.week) {
    frequencyToken = token.paragraph(
      `Range: Weekly | ${dayjs().subtract(1, 'week').toISOString()} - ${dayjs().toISOString()}`
    );
  } else if (channel.notifyFrequency === FeedChannelNotifyFrequency.month) {
    frequencyToken = token.paragraph(
      `Range: Monthly | ${dayjs().subtract(1, 'month').toISOString()} - ${dayjs().toISOString()}`
    );
  }

  const eventTokens: ContentToken[] = [
    token.title('Feed Report from Channel: ' + channel.name, 2),
    frequencyToken,
    token.list(
      events.map((event) =>
        token.text(
          `[${event.eventName}] ${event.senderName}: ${event.eventContent}`
        )
      )
    ),
  ];

  await Promise.all(
    channel.notifications.map((notification) =>
      sendNotification(notification, 'Feed Report', eventTokens).catch((err) =>
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
