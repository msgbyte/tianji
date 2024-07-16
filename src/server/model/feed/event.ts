import {
  FeedChannelNotifyFrequency,
  FeedEvent,
  Notification,
  Prisma,
} from '@prisma/client';
import { subscribeEventBus } from '../../ws/shared';
import { prisma } from '../_client';
import { serializeJSON } from '../../utils/json';
import { buildQueryWithCache } from '../../cache';
import { sendNotification } from '../notification';
import { token } from '../notification/token';
import { logger } from '../../utils/logger';

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
      return [null, []] as const;
    }

    return [channel.notifyFrequency, channel.notifications] as const;
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
    const [notify, notifications] = await getFeedEventNotify(event.channelId);

    if (notify === FeedChannelNotifyFrequency.event) {
      // send notify every event
      sendFeedEventsNotify(notifications, [event]);
    }
  }
}

export async function sendFeedEventsNotify(
  notifications: Notification[],
  events: FeedEvent[]
) {
  const eventTokens = events
    .map((event) => [
      token.text(
        `[${event.eventName}] ${event.senderName}: ${event.eventContent}`
      ),
      token.newline(),
    ])
    .flat();

  await Promise.all(
    notifications.map((notification) =>
      sendNotification(notification, 'Feed Report', eventTokens).catch((err) =>
        logger.error('[Notification] sendFeedEventsNotify', err)
      )
    )
  );
}
