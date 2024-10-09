import * as z from "zod"
import * as imports from "./schemas/index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const LemonSqueezyWebhookEventModelSchema = z.object({
  id: z.string(),
  eventName: z.string(),
  /**
   * [CommonPayload]
   */
  payload: imports.CommonPayloadSchema,
  createdAt: z.date(),
})
