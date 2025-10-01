import * as z from "zod"
import * as imports from "./schemas/index.js"
import { FeedChannelNotifyFrequency } from "@prisma/client"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteFeedEvent, RelatedFeedEventModelSchema, CompleteFeedState, RelatedFeedStateModelSchema, CompleteNotification, RelatedNotificationModelSchema } from "./index.js"

export const FeedChannelModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  webhookSignature: z.string(),
  notifyFrequency: z.nativeEnum(FeedChannelNotifyFrequency),
  publicShareId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteFeedChannel extends z.infer<typeof FeedChannelModelSchema> {
  workspace: CompleteWorkspace
  events: CompleteFeedEvent[]
  states: CompleteFeedState[]
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
  states: RelatedFeedStateModelSchema.array(),
  notifications: RelatedNotificationModelSchema.array(),
}))
