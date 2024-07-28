import { Notification } from '@prisma/client';
import { notificationProviders } from './provider/index.js';
import { ExactType } from '../../../types/index.js';
import { ContentToken } from './token/index.js';

export async function sendNotification(
  notification: ExactType<
    Pick<Notification, 'name' | 'type' | 'payload'>,
    {
      type: keyof typeof notificationProviders;
    }
  >,
  title: string,
  message: ContentToken[]
) {
  const type = notification.type;

  if (!notificationProviders[type]) {
    throw new Error('Not match type:' + type);
  }

  await notificationProviders[type].send(notification, title, message);
}
