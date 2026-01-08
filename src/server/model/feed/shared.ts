import { buildQueryWithCache } from '../../cache/index.js';
import { prisma } from '../_client.js';

export const { get: getFeedEventNotify, del: delFeedEventNotifyCache } =
  buildQueryWithCache('feedChannel', async (channelId: string) => {
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
