import { Monitor } from '@prisma/client';

export interface MonitorProvider {
  run: (monitor: Monitor) => Promise<number>;
}
