import type { Monitor } from '@prisma/client';
import { ExactType } from './utils';
import { schemas } from '.';

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
