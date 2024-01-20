import * as z from "zod"
import * as imports from "./schemas"
import { CompleteTelemetryEvent, RelatedTelemetryEventModelSchema } from "./index"

export const TelemetrySessionModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  hostname: z.string().nullish(),
  browser: z.string().nullish(),
  os: z.string().nullish(),
  ip: z.string().nullish(),
  country: z.string().nullish(),
  subdivision1: z.string().nullish(),
  subdivision2: z.string().nullish(),
  city: z.string().nullish(),
  createdAt: z.date(),
})

export interface CompleteTelemetrySession extends z.infer<typeof TelemetrySessionModelSchema> {
  telemetryEvent: CompleteTelemetryEvent[]
}

/**
 * RelatedTelemetrySessionModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedTelemetrySessionModelSchema: z.ZodSchema<CompleteTelemetrySession> = z.lazy(() => TelemetrySessionModelSchema.extend({
  telemetryEvent: RelatedTelemetryEventModelSchema.array(),
}))
