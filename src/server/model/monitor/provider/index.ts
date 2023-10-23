import { http } from './http';
import { ping } from './ping';
import type { MonitorProvider } from './type';

export const monitorProviders: Record<string, MonitorProvider<any>> = {
  ping,
  http,
};
