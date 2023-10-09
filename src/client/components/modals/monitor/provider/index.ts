import React from 'react';
import { MonitorInfo } from '../../../../../types';
import { MonitorPing } from './ping';

interface MonitorProvider {
  label: string;
  name: string;
  link: (info: MonitorInfo) => React.ReactNode;
  form: React.ComponentType;
}

export const monitorProviders: MonitorProvider[] = [
  {
    label: 'Ping',
    name: 'ping',
    link: (info) => String(info.payload.hostname),
    form: MonitorPing,
  },
];

export function getMonitorLink(info: MonitorInfo): React.ReactNode {
  const provider = monitorProviders.find((m) => m.name === info.type);
  if (!provider) {
    return null;
  }

  return provider.link(info);
}
