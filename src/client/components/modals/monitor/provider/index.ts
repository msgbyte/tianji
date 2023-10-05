import React from 'react';
import { MonitorPing } from './ping';

interface MonitorProvider {
  label: string;
  name: string;
  form: React.ComponentType;
}

export const monitorProviders: MonitorProvider[] = [
  {
    label: 'Ping',
    name: 'ping',
    form: MonitorPing,
  },
];
