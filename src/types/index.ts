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
    type MonitorStatusPageList = {
      id: string;
    }[];
  }
}
