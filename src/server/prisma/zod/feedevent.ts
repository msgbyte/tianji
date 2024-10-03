import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteFeedChannel, RelatedFeedChannelModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

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
  url: z.string().nullish(),
  important: z.boolean(),
  archived: z.boolean(),
  /**
   * [Nullable<PrismaJson.CommonPayload>]
   */
  payload: imports.CommonPayloadSchema.nullish(),
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
