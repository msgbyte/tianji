import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteMonitor, RelatedMonitorModelSchema, CompleteFeedChannel, RelatedFeedChannelModelSchema } from "./index.js"

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
  payload: imports.CommonPayloadSchema,
  createdAt: z.date(),
})

export interface CompleteNotification extends z.infer<typeof NotificationModelSchema> {
  workspace: CompleteWorkspace
  monitors: CompleteMonitor[]
  feedChannels: CompleteFeedChannel[]
}

/**
 * RelatedNotificationModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedNotificationModelSchema: z.ZodSchema<CompleteNotification> = z.lazy(() => NotificationModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  monitors: RelatedMonitorModelSchema.array(),
  feedChannels: RelatedFeedChannelModelSchema.array(),
}))
