import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteMonitor, RelatedMonitorModelSchema } from "./index.js"

export const MonitorDataModelSchema = z.object({
  id: z.string(),
  monitorId: z.string(),
  value: z.number().int(),
  createdAt: z.date(),
})

export interface CompleteMonitorData extends z.infer<typeof MonitorDataModelSchema> {
  monitor: CompleteMonitor
}

/**
 * RelatedMonitorDataModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedMonitorDataModelSchema: z.ZodSchema<CompleteMonitorData> = z.lazy(() => MonitorDataModelSchema.extend({
  monitor: RelatedMonitorModelSchema,
}))
