import { http } from './http';
import { ping } from './ping';
import { openai } from './openai';
import type { MonitorProvider } from './type';
import { custom } from './custom';
import { tcp } from './tcp';
import { dns } from './dns';

export const monitorProviders: Record<string, MonitorProvider<any>> = {
  ping,
  http,
  tcp,
  dns,
  openai,
  custom,
};
