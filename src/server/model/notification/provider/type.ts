import { Notification } from '@prisma/client';

export interface NotificationProvider {
  send: (
    notification: Pick<Notification, 'name' | 'type' | 'payload'>,
    title: string,
    message: string
  ) => Promise<void>;
}
