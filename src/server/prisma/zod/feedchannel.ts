import * as z from "zod"
import * as imports from "./schemas"
import { FeedChannelNotifyFrequency } from "@prisma/client"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteFeedEvent, RelatedFeedEventModelSchema, CompleteNotification, RelatedNotificationModelSchema } from "./index"

export const FeedChannelModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  notifyFrequency: z.nativeEnum(FeedChannelNotifyFrequency),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteFeedChannel extends z.infer<typeof FeedChannelModelSchema> {
  workspace: CompleteWorkspace
  events: CompleteFeedEvent[]
  notifications: CompleteNotification[]
}

/**
 * RelatedFeedChannelModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFeedChannelModelSchema: z.ZodSchema<CompleteFeedChannel> = z.lazy(() => FeedChannelModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  events: RelatedFeedEventModelSchema.array(),
  notifications: RelatedNotificationModelSchema.array(),
}))
