import * as z from "zod"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteMonitor, RelatedMonitorModelSchema } from "./index"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const NotificationModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  type: z.string(),
  /**
   * [CommonPayload]
   */
  payload: jsonSchema,
  createdAt: z.date(),
})

export interface CompleteNotification extends z.infer<typeof NotificationModelSchema> {
  workspace: CompleteWorkspace
  monitors: CompleteMonitor[]
}

/**
 * RelatedNotificationModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedNotificationModelSchema: z.ZodSchema<CompleteNotification> = z.lazy(() => NotificationModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  monitors: RelatedMonitorModelSchema.array(),
}))
