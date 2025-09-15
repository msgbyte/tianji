import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspaceSubscription, RelatedWorkspaceSubscriptionModelSchema, CompleteWorkspacesOnUsers, RelatedWorkspacesOnUsersModelSchema, CompleteWebsite, RelatedWebsiteModelSchema, CompleteApplication, RelatedApplicationModelSchema, CompleteNotification, RelatedNotificationModelSchema, CompleteMonitor, RelatedMonitorModelSchema, CompleteMonitorStatusPage, RelatedMonitorStatusPageModelSchema, CompleteTelemetry, RelatedTelemetryModelSchema, CompleteWorkspaceDailyUsage, RelatedWorkspaceDailyUsageModelSchema, CompleteWorkspaceAuditLog, RelatedWorkspaceAuditLogModelSchema, CompleteSurvey, RelatedSurveyModelSchema, CompleteFeedChannel, RelatedFeedChannelModelSchema, CompleteWorkspaceInvitation, RelatedWorkspaceInvitationModelSchema, CompleteFunctionWorker, RelatedFunctionWorkerModelSchema, CompleteWarehouseCohorts, RelatedWarehouseCohortsModelSchema, CompleteWarehouseDatabase, RelatedWarehouseDatabaseModelSchema, CompleteWarehouseDatabaseTable, RelatedWarehouseDatabaseTableModelSchema, CompleteAIGateway, RelatedAIGatewayModelSchema, CompleteAIGatewayQuotaAlert, RelatedAIGatewayQuotaAlertModelSchema, CompleteWorkspaceConfig, RelatedWorkspaceConfigModelSchema } from "./index.js"

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
  credit: z.number().int(),
  paused: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteWorkspace extends z.infer<typeof WorkspaceModelSchema> {
  subscription?: CompleteWorkspaceSubscription | null
  users: CompleteWorkspacesOnUsers[]
  websites: CompleteWebsite[]
  applications: CompleteApplication[]
  notifications: CompleteNotification[]
  monitors: CompleteMonitor[]
  monitorStatusPages: CompleteMonitorStatusPage[]
  telemetryList: CompleteTelemetry[]
  workspaceDailyUsage: CompleteWorkspaceDailyUsage[]
  workspaceAuditLog: CompleteWorkspaceAuditLog[]
  surveys: CompleteSurvey[]
  feedChannels: CompleteFeedChannel[]
  workspaceInvitation: CompleteWorkspaceInvitation[]
  functionWorkers: CompleteFunctionWorker[]
  warehouseCohorts: CompleteWarehouseCohorts[]
  warehouseDatabase: CompleteWarehouseDatabase[]
  warehouseDatabaseTable: CompleteWarehouseDatabaseTable[]
  aiGateways: CompleteAIGateway[]
  aiGatewayQuotaAlerts: CompleteAIGatewayQuotaAlert[]
  workspaceConfigs: CompleteWorkspaceConfig[]
}

/**
 * RelatedWorkspaceModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWorkspaceModelSchema: z.ZodSchema<CompleteWorkspace> = z.lazy(() => WorkspaceModelSchema.extend({
  subscription: RelatedWorkspaceSubscriptionModelSchema.nullish(),
  users: RelatedWorkspacesOnUsersModelSchema.array(),
  websites: RelatedWebsiteModelSchema.array(),
  applications: RelatedApplicationModelSchema.array(),
  notifications: RelatedNotificationModelSchema.array(),
  monitors: RelatedMonitorModelSchema.array(),
  monitorStatusPages: RelatedMonitorStatusPageModelSchema.array(),
  telemetryList: RelatedTelemetryModelSchema.array(),
  workspaceDailyUsage: RelatedWorkspaceDailyUsageModelSchema.array(),
  workspaceAuditLog: RelatedWorkspaceAuditLogModelSchema.array(),
  surveys: RelatedSurveyModelSchema.array(),
  feedChannels: RelatedFeedChannelModelSchema.array(),
  workspaceInvitation: RelatedWorkspaceInvitationModelSchema.array(),
  functionWorkers: RelatedFunctionWorkerModelSchema.array(),
  warehouseCohorts: RelatedWarehouseCohortsModelSchema.array(),
  warehouseDatabase: RelatedWarehouseDatabaseModelSchema.array(),
  warehouseDatabaseTable: RelatedWarehouseDatabaseTableModelSchema.array(),
  aiGateways: RelatedAIGatewayModelSchema.array(),
  aiGatewayQuotaAlerts: RelatedAIGatewayQuotaAlertModelSchema.array(),
  workspaceConfigs: RelatedWorkspaceConfigModelSchema.array(),
}))
