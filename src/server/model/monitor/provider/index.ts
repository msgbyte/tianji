import { http } from './http.js';
import { ping } from './ping.js';
import { openai } from './openai.js';
import type { MonitorProvider } from './type.js';
import { custom } from './custom.js';
import { tcp } from './tcp.js';
import { dns } from './dns.js';

export const monitorProviders: Record<string, MonitorProvider<any>> = {
  ping,
  http,
  tcp,
  dns,
  openai,
  custom,
};
