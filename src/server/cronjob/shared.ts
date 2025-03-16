import { FeedChannelNotifyFrequency } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { prisma } from '../model/_client.js';
import dayjs from 'dayjs';
import { sendFeedEventsNotify } from '../model/feed/event.js';

/**
 * Check feed events notify
 */
export async function checkFeedEventsNotify(
  notifyFrequency: FeedChannelNotifyFrequency
) {
  logger.info(
    '[checkFeedEventsNotify] Start run checkFeedEventsNotify with:',
    notifyFrequency
  );

  const channels = await prisma.feedChannel.findMany({
    where: {
      notifyFrequency,
    },
    include: {
      notifications: true,
    },
  });

  let startDate = dayjs().subtract(1, 'day').toDate();

  if (notifyFrequency === FeedChannelNotifyFrequency.month) {
    startDate = dayjs().subtract(1, 'month').toDate();
  }

  if (notifyFrequency === FeedChannelNotifyFrequency.week) {
    startDate = dayjs().subtract(1, 'week').toDate();
  }

  logger.info(`[checkFeedEventsNotify] find ${channels.length} channel`);

  await pMap(
    channels,
    async (channel) => {
      const events = await prisma.feedEvent.findMany({
        where: {
          channelId: channel.id,
          createdAt: {
            gte: startDate,
          },
        },
      });

      if (events.length === 0) {
        logger.info(
          'Skip send events report because not include any events in this channel',
          channel.id
        );
        return;
      }

      await sendFeedEventsNotify(channel, events);
    },
    {
      concurrency: 5,
    }
  );

  logger.info(`[checkFeedEventsNotify] completed.`);
}
