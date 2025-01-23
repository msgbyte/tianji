import { apprise } from './apprise.js';
import { feishu } from './feishu.js';
import { smtp } from './smtp.js';
import { telegram } from './telegram.js';
import { webhook } from './webhook.js';
import { teams } from './teams.js';
import type { NotificationProvider } from './type.js';

export const notificationProviders: Record<string, NotificationProvider> = {
  smtp,
  apprise,
  telegram,
  feishu,
  webhook,
  teams,
};
