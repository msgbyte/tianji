import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspacesOnUsers, RelatedWorkspacesOnUsersModelSchema, CompleteWebsite, RelatedWebsiteModelSchema, CompleteNotification, RelatedNotificationModelSchema, CompleteMonitor, RelatedMonitorModelSchema, CompleteMonitorStatusPage, RelatedMonitorStatusPageModelSchema, CompleteTelemetry, RelatedTelemetryModelSchema, CompleteUser, RelatedUserModelSchema, CompleteWorkspaceDailyUsage, RelatedWorkspaceDailyUsageModelSchema, CompleteWorkspaceAuditLog, RelatedWorkspaceAuditLogModelSchema, CompleteSurvey, RelatedSurveyModelSchema, CompleteFeedChannel, RelatedFeedChannelModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const WorkspaceModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  dashboardOrder: z.string().array(),
  /**
   * [DashboardLayout]
   */
  dashboardLayout: jsonSchema,
  /**
   * [CommonPayload]
   */
  settings: imports.CommonPayloadSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteWorkspace extends z.infer<typeof WorkspaceModelSchema> {
  users: CompleteWorkspacesOnUsers[]
  websites: CompleteWebsite[]
  notifications: CompleteNotification[]
  monitors: CompleteMonitor[]
  monitorStatusPages: CompleteMonitorStatusPage[]
  telemetryList: CompleteTelemetry[]
  selectedUsers: CompleteUser[]
  workspaceDailyUsage: CompleteWorkspaceDailyUsage[]
  workspaceAuditLog: CompleteWorkspaceAuditLog[]
  surveys: CompleteSurvey[]
  feedChannels: CompleteFeedChannel[]
}

/**
 * RelatedWorkspaceModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWorkspaceModelSchema: z.ZodSchema<CompleteWorkspace> = z.lazy(() => WorkspaceModelSchema.extend({
  users: RelatedWorkspacesOnUsersModelSchema.array(),
  websites: RelatedWebsiteModelSchema.array(),
  notifications: RelatedNotificationModelSchema.array(),
  monitors: RelatedMonitorModelSchema.array(),
  monitorStatusPages: RelatedMonitorStatusPageModelSchema.array(),
  telemetryList: RelatedTelemetryModelSchema.array(),
  selectedUsers: RelatedUserModelSchema.array(),
  workspaceDailyUsage: RelatedWorkspaceDailyUsageModelSchema.array(),
  workspaceAuditLog: RelatedWorkspaceAuditLogModelSchema.array(),
  surveys: RelatedSurveyModelSchema.array(),
  feedChannels: RelatedFeedChannelModelSchema.array(),
}))
