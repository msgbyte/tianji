import * as z from "zod"
import * as imports from "./schemas"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteTelemetrySession, RelatedTelemetrySessionModelSchema, CompleteTelemetryEvent, RelatedTelemetryEventModelSchema } from "./index"

export const TelemetryModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullish(),
})

export interface CompleteTelemetry extends z.infer<typeof TelemetryModelSchema> {
  workspace: CompleteWorkspace
  sessions: CompleteTelemetrySession[]
  events: CompleteTelemetryEvent[]
}

/**
 * RelatedTelemetryModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedTelemetryModelSchema: z.ZodSchema<CompleteTelemetry> = z.lazy(() => TelemetryModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  sessions: RelatedTelemetrySessionModelSchema.array(),
  events: RelatedTelemetryEventModelSchema.array(),
}))
