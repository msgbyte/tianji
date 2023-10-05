import { Monitor } from '@prisma/client';
import type { ExactType } from '../../../../types';

export interface MonitorProvider<Payload extends Record<string, any>> {
  run: (monitor: ExactType<Monitor, { payload: Payload }>) => Promise<number>;
}
