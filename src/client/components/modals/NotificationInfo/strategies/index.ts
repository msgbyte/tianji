import React from 'react';
import { NotificationSMTP } from './smtp';

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
];
