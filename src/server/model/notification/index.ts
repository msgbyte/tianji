import { Notification } from '@prisma/client';
import { notificationProviders } from './provider';
import { ExactType } from '../../../types';
import { ContentToken } from './token';

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
