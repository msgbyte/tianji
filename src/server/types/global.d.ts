import type { JWTPayload } from '../middleware/auth';
import type {
  MonitorStatusPageListSchema,
  SurveyPayloadSchema,
} from '../prisma/zod/schemas';

declare global {
  namespace Express {
    interface User extends JWTPayload {}
  }

  namespace PrismaJson {
    type CommonPayload = Record<string, any>;
    type DashboardLayout = {
      layouts: Record<string, any[]>;
      items: any[];
    } | null;
    type MonitorStatusPageList = z.infer<typeof MonitorStatusPageListSchema>;
    type SurveyPayload = z.infer<typeof SurveyPayloadSchema>;
  }
}
