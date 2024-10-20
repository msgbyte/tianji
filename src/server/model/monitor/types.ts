import { Monitor, Notification } from '@prisma/client';

export type MonitorWithNotification = Monitor & {
  notifications: Notification[];
};
