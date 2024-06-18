import React from 'react';
import { NotificationSMTP } from './smtp';
import { NotificationTelegram } from './telegram';
import { NotificationApprise } from './apprise';
import { NotificationFeishu } from './feishu';
import { NotificationWebhook } from './webhook';

interface NotificationStrategy {
  label: string;
  name: string;
  form: React.ComponentType;
}

export const notificationStrategies: NotificationStrategy[] = [
  {
    label: 'Email(SMTP)',
    name: 'smtp',
    form: NotificationSMTP,
  },
  {
    label: 'Apprise(Support 90+ services)',
    name: 'apprise',
    form: NotificationApprise,
  },
  {
    label: 'Telegram',
    name: 'telegram',
    form: NotificationTelegram,
  },
  {
    label: 'Feishu',
    name: 'feishu',
    form: NotificationFeishu,
  },
  {
    label: 'Webhook',
    name: 'webhook',
    form: NotificationWebhook,
  },
];
