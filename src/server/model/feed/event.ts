import { Prisma } from '@prisma/client';
import { subscribeEventBus } from '../../ws/shared';
import { prisma } from '../_client';
import { serializeJSON } from '../../utils/json';

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
}
