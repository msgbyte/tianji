import React from 'react';
import { MonitorInfo } from '../../../../types';
import { pingProvider } from './ping';
import { httpProvider } from './http';
import { MonitorProvider } from './types';
import { openaiProvider } from './openai';

export const monitorProviders: MonitorProvider[] = [
  pingProvider, // ping
  httpProvider, // http
  openaiProvider, // http
];

export function getMonitorProvider(type: string) {
  const provider = monitorProviders.find((m) => m.name === type);
  if (!provider) {
    return null;
  }

  return provider;
}

export function getMonitorLink(info: MonitorInfo): React.ReactNode {
  const provider = getMonitorProvider(info.type);
  if (!provider || !provider.link) {
    return null;
  }

  return provider.link(info);
}
