import { Notification } from '@prisma/client';
import { ContentToken } from '../token/index.js';

export interface NotificationProvider {
  send: (
    notification: Pick<Notification, 'name' | 'type' | 'payload'>,
    title: string,
    message: ContentToken[],
    payload?: Record<string, any>
  ) => Promise<void>;
}
