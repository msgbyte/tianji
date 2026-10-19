import { TRPCError } from '@trpc/server';
import { prisma } from '../../../model/_client.js';

export async function requireWorkspaceFeedChannel(
  workspaceId: string,
  channelId: string
) {
  const channel = await prisma.feedChannel.findFirst({
    where: {
      id: channelId,
      workspaceId,
    },
    select: { id: true },
  });

  if (!channel) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Channel not found',
    });
  }

  return channel;
}
