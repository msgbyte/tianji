import { Notification } from '@prisma/client';
import { notificationProviders } from './provider';

export async function sendNotification(
  notification: Pick<Notification, 'name' | 'type' | 'payload'>,
  message: string
) {
  const type = notification.type;

  if (!notificationProviders[type]) {
    throw new Error('Not match type:' + type);
  }

  await notificationProviders[type].send(notification, message);
}
