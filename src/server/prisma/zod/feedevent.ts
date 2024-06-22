import * as z from "zod"
import * as imports from "./schemas"
import { CompleteFeedChannel, RelatedFeedChannelModelSchema } from "./index"

export const FeedEventModelSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  eventName: z.string(),
  eventContent: z.string(),
  tags: z.string().array(),
  source: z.string(),
  senderId: z.string().nullish(),
  senderName: z.string().nullish(),
  important: z.boolean(),
})

export interface CompleteFeedEvent extends z.infer<typeof FeedEventModelSchema> {
  channel: CompleteFeedChannel
}

/**
 * RelatedFeedEventModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFeedEventModelSchema: z.ZodSchema<CompleteFeedEvent> = z.lazy(() => FeedEventModelSchema.extend({
  channel: RelatedFeedChannelModelSchema,
}))
