import React from 'react';
import { NotificationSMTP } from './smtp';
import { NotificationTelegram } from './telegram';

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
    label: 'Telegram',
    name: 'telegram',
    form: NotificationTelegram,
  },
];
