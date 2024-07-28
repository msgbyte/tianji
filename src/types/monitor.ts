import type { MonitorModelSchema } from '../server/prisma/zod/index.js';
import type { ExactType } from './utils.js';
import z from 'zod';

type Monitor = z.infer<typeof MonitorModelSchema>;

export type MonitorInfo = ExactType<
  Monitor,
  {
    payload: Record<string, any>;
  }
>;
