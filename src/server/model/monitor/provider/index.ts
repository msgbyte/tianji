import { http } from './http';
import { ping } from './ping';
import { openai } from './openai';
import type { MonitorProvider } from './type';
import { custom } from './custom';
import { tcp } from './tcp';

export const monitorProviders: Record<string, MonitorProvider<any>> = {
  ping,
  http,
  tcp,
  openai,
  custom,
};
