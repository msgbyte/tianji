import { smtp } from './smtp';
import type { NotificationProvider } from './type';

export const notificationProviders: Record<string, NotificationProvider> = {
  smtp,
};
