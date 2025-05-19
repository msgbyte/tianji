import * as z from "zod"
import * as imports from "./schemas/index.js"
import { FeedStateStatus } from "@prisma/client"
import { CompleteFeedChannel, RelatedFeedChannelModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const FeedStateModelSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  eventId: z.string(),
  eventName: z.string(),
  eventContent: z.string(),
  tags: z.string().array(),
  source: z.string(),
  senderId: z.string().nullish(),
  senderName: z.string().nullish(),
  url: z.string().nullish(),
  important: z.boolean(),
  status: z.nativeEnum(FeedStateStatus),
  resolvedAt: z.date().nullish(),
  /**
   * [Nullable<PrismaJson.CommonPayload>]
   */
  payload: imports.CommonPayloadSchema.nullish(),
})

export interface CompleteFeedState extends z.infer<typeof FeedStateModelSchema> {
  channel: CompleteFeedChannel
}

/**
 * RelatedFeedStateModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFeedStateModelSchema: z.ZodSchema<CompleteFeedState> = z.lazy(() => FeedStateModelSchema.extend({
  channel: RelatedFeedChannelModelSchema,
}))
