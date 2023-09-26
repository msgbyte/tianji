import { prisma } from './_client';

export function getWorkspaceNotifications(workspaceId: string) {
  return prisma.notification.findMany({
    where: {
      workspaceId,
    },
  });
}

export async function createWorkspaceNotification(
  workspaceId: string,
  name: string,
  type: string,
  payload: Record<string, any>
) {
  const notification = await prisma.notification.create({
    data: {
      workspaceId,
      name,
      type,
      payload,
    },
  });

  return notification;
}
