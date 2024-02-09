import * as z from "zod"
import * as imports from "./schemas"
import { CompleteTelemetrySession, RelatedTelemetrySessionModelSchema } from "./index"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const TelemetryEventModelSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  workspaceId: z.string(),
  eventName: z.string().nullish(),
  urlOrigin: z.string(),
  urlPath: z.string(),
  /**
   * [CommonPayload]
   */
  payload: imports.CommonPayloadSchema,
  createdAt: z.date(),
})

export interface CompleteTelemetryEvent extends z.infer<typeof TelemetryEventModelSchema> {
  session: CompleteTelemetrySession
}

/**
 * RelatedTelemetryEventModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedTelemetryEventModelSchema: z.ZodSchema<CompleteTelemetryEvent> = z.lazy(() => TelemetryEventModelSchema.extend({
  session: RelatedTelemetrySessionModelSchema,
}))
