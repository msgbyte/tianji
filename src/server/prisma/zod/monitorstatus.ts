import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteMonitor, RelatedMonitorModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const MonitorStatusModelSchema = z.object({
  monitorId: z.string(),
  statusName: z.string(),
  /**
   * [CommonPayload]
   */
  payload: imports.CommonPayloadSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteMonitorStatus extends z.infer<typeof MonitorStatusModelSchema> {
  monitor: CompleteMonitor
}

/**
 * RelatedMonitorStatusModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedMonitorStatusModelSchema: z.ZodSchema<CompleteMonitorStatus> = z.lazy(() => MonitorStatusModelSchema.extend({
  monitor: RelatedMonitorModelSchema,
}))
