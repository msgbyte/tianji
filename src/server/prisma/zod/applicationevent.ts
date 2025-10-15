import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteApplicationEventData, RelatedApplicationEventDataModelSchema, CompleteApplicationSession, RelatedApplicationSessionModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema)]))

export const ApplicationEventModelSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  sessionId: z.string(),
  eventType: z.number().int(),
  eventName: z.string().nullish(),
  screenName: z.string().nullish(),
  screenParams: jsonSchema,
  createdAt: z.date(),
})

export interface CompleteApplicationEvent extends z.infer<typeof ApplicationEventModelSchema> {
  eventData: CompleteApplicationEventData[]
  session: CompleteApplicationSession
}

/**
 * RelatedApplicationEventModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedApplicationEventModelSchema: z.ZodSchema<CompleteApplicationEvent> = z.lazy(() => ApplicationEventModelSchema.extend({
  eventData: RelatedApplicationEventDataModelSchema.array(),
  session: RelatedApplicationSessionModelSchema,
}))
