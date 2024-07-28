import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteTelemetry, RelatedTelemetryModelSchema, CompleteTelemetryEvent, RelatedTelemetryEventModelSchema } from "./index.js"

export const TelemetrySessionModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  telemetryId: z.string().nullish(),
  hostname: z.string().nullish(),
  browser: z.string().nullish(),
  os: z.string().nullish(),
  ip: z.string().nullish(),
  country: z.string().nullish(),
  subdivision1: z.string().nullish(),
  subdivision2: z.string().nullish(),
  city: z.string().nullish(),
  longitude: z.number().nullish(),
  latitude: z.number().nullish(),
  accuracyRadius: z.number().int().nullish(),
  createdAt: z.date(),
})

export interface CompleteTelemetrySession extends z.infer<typeof TelemetrySessionModelSchema> {
  telemetry?: CompleteTelemetry | null
  telemetryEvent: CompleteTelemetryEvent[]
}

/**
 * RelatedTelemetrySessionModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedTelemetrySessionModelSchema: z.ZodSchema<CompleteTelemetrySession> = z.lazy(() => TelemetrySessionModelSchema.extend({
  telemetry: RelatedTelemetryModelSchema.nullish(),
  telemetryEvent: RelatedTelemetryEventModelSchema.array(),
}))
