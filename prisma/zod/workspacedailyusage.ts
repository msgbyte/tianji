import * as z from "zod"
import * as imports from "./schemas"
import { CompleteWorkspace, RelatedWorkspaceModelSchema } from "./index"

export const WorkspaceDailyUsageModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  date: z.date(),
  websiteAcceptedCount: z.number().int(),
  websiteEventCount: z.number().int(),
  monitorExecutionCount: z.number().int(),
  createdAt: z.date(),
})

export interface CompleteWorkspaceDailyUsage extends z.infer<typeof WorkspaceDailyUsageModelSchema> {
  workspace: CompleteWorkspace
}

/**
 * RelatedWorkspaceDailyUsageModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWorkspaceDailyUsageModelSchema: z.ZodSchema<CompleteWorkspaceDailyUsage> = z.lazy(() => WorkspaceDailyUsageModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
}))
