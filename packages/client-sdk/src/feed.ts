import { $OpenApiTs, FeedService } from './open/client';

export async function sendFeed(
  channelId: string,
  payload: $OpenApiTs['/feed/{channelId}/send']['post']['req']['requestBody']
) {
  const res = await FeedService.feedSendEvent({
    channelId,
    requestBody: payload,
  });

  return res;
}
