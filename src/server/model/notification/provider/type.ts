import { Notification } from '@prisma/client';
import { ContentToken } from '../token';

export interface NotificationProvider {
  send: (
    notification: Pick<Notification, 'name' | 'type' | 'payload'>,
    title: string,
    message: ContentToken[]
  ) => Promise<void>;
}
