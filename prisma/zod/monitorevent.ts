import * as z from "zod"
import { CompleteMonitor, RelatedMonitorModelSchema } from "./index"

export const MonitorEventModelSchema = z.object({
  id: z.string(),
  message: z.string(),
  monitorId: z.string(),
  type: z.string(),
  createdAt: z.date(),
})

export interface CompleteMonitorEvent extends z.infer<typeof MonitorEventModelSchema> {
  monitor: CompleteMonitor
}

/**
 * RelatedMonitorEventModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedMonitorEventModelSchema: z.ZodSchema<CompleteMonitorEvent> = z.lazy(() => MonitorEventModelSchema.extend({
  monitor: RelatedMonitorModelSchema,
}))
