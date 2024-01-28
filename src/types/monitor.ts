import type { MonitorModelSchema } from '../server/prisma/zod';
import { ExactType } from './utils';
import z from 'zod';

type Monitor = z.infer<typeof MonitorModelSchema>;

export type MonitorInfo = ExactType<
  Monitor,
  {
    payload: Record<string, any>;
  }
>;
