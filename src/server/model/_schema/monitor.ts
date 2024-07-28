import { MonitorInfo } from '../../../types/index.js';
import { MonitorModelSchema } from '../../prisma/zod/monitor.js';

export type MonitorInfoWithNotificationIds = MonitorInfo & {
  notifications: { id: string }[];
};

export const monitorPublicInfoSchema = MonitorModelSchema.pick({
  id: true,
  name: true,
  type: true,
});
