import React from 'react';
import { NotificationSMTP } from './smtp';
import { NotificationTelegram } from './telegram';
import { NotificationApprise } from './apprise';

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
];
