import { Notification } from '@prisma/client';

export interface NotificationProvider {
  send: (
    notification: Pick<Notification, 'name' | 'type' | 'payload'>,
    message: string
  ) => Promise<void>;
}
