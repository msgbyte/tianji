import { MonitorInfo } from '../../../types';
import { MonitorModelSchema } from '../../prisma/zod';

export type MonitorInfoWithNotificationIds = MonitorInfo & {
  notifications: { id: string }[];
};

export const monitorPublicInfoSchema = MonitorModelSchema.pick({
  id: true,
  name: true,
  type: true,
});
