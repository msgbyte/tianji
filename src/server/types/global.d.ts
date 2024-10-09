import type { JWTPayload } from '../middleware/auth.ts';
import type {
  MonitorStatusPageListSchema,
  SurveyPayloadSchema,
  StatusPageIncidentPayloadSchema,
} from '../prisma/zod/schemas/index.ts';

declare global {
  namespace Express {
    interface User extends JWTPayload {}

    interface Request {
      rawBody: unknown;
    }
  }

  namespace PrismaJson {
    type CommonPayload = Record<string, any>;
    type Nullable<T> = Record<string, any> | null | undefined;
    type DashboardLayout = {
      layouts: Record<string, any[]>;
      items: any[];
    } | null;
    type MonitorStatusPageList = z.infer<typeof MonitorStatusPageListSchema>;
    type SurveyPayload = z.infer<typeof SurveyPayloadSchema>;
    type StatusPageIncidentPayload = z.infer<
      typeof StatusPageIncidentPayloadSchema
    >;
  }
}
