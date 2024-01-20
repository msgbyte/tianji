import type { MonitorModelSchema } from '../server/prisma/zod';
import { ExactType } from './utils';
import { schemas } from '.';
import z from 'zod';

type Monitor = z.infer<typeof MonitorModelSchema>;

export type MonitorInfo = ExactType<
  Monitor,
  {
    payload: Record<string, any>;
  }
>;

export type MonitorInfoWithNotificationIds = MonitorInfo & {
  notifications: { id: string }[];
};

export const MonitorPublicInfoSchema = schemas.MonitorModelSchema.pick({
  id: true,
  name: true,
  type: true,
});
