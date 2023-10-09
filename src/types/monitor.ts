import type { Monitor } from '@prisma/client';
import { ExactType } from './utils';

export type MonitorInfo = ExactType<
  Monitor,
  {
    payload: Record<string, any>;
  }
>;
