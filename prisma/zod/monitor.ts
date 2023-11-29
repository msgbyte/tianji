import * as z from "zod"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteWebsite, RelatedWebsiteModelSchema, CompleteNotification, RelatedNotificationModelSchema, CompleteMonitorEvent, RelatedMonitorEventModelSchema, CompleteMonitorData, RelatedMonitorDataModelSchema, CompleteMonitorStatus, RelatedMonitorStatusModelSchema } from "./index"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const MonitorModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  type: z.string(),
  active: z.boolean(),
  interval: z.number().int(),
  /**
   * [CommonPayload]
   */
  payload: jsonSchema,
  createdAt: z.date(),
})

export interface CompleteMonitor extends z.infer<typeof MonitorModelSchema> {
  workspace: CompleteWorkspace
  websites: CompleteWebsite[]
  notifications: CompleteNotification[]
  events: CompleteMonitorEvent[]
  datas: CompleteMonitorData[]
  status: CompleteMonitorStatus[]
}

/**
 * RelatedMonitorModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedMonitorModelSchema: z.ZodSchema<CompleteMonitor> = z.lazy(() => MonitorModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  websites: RelatedWebsiteModelSchema.array(),
  notifications: RelatedNotificationModelSchema.array(),
  events: RelatedMonitorEventModelSchema.array(),
  datas: RelatedMonitorDataModelSchema.array(),
  status: RelatedMonitorStatusModelSchema.array(),
}))
