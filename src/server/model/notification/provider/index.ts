import { apprise } from './apprise';
import { feishu } from './feishu';
import { smtp } from './smtp';
import { telegram } from './telegram';
import type { NotificationProvider } from './type';

export const notificationProviders: Record<string, NotificationProvider> = {
  smtp,
  apprise,
  telegram,
  feishu,
};
