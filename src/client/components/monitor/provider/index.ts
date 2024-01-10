import React from 'react';
import { MonitorInfo } from '../../../../types';
import { pingProvider } from './ping';
import { httpProvider } from './http';
import { MonitorProvider } from './types';
import { openaiProvider } from './openai';
import { customProvider } from './custom';
import { tcpProvider } from './tcp';

export const monitorProviders: MonitorProvider[] = [
  pingProvider, // ping
  tcpProvider, // tcp
  httpProvider, // http
  openaiProvider, // openai
  customProvider, // custom node script
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
