import { z } from 'zod';
import { MonitorStatusPageListSchema } from '../../prisma/zod/schemas';

export * as schemas from '../../prisma/zod/index';
export * from './server';
export * from './monitor';
export * from './utils';

declare global {
  namespace PrismaJson {
    type CommonPayload = Record<string, any>;
    type DashboardLayout = {
      layouts: Record<string, any[]>;
      items: any[];
    } | null;
    type MonitorStatusPageList = z.infer<typeof MonitorStatusPageListSchema>;
  }
}
