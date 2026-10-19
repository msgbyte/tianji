import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteAIRouterTier, RelatedAIRouterTierModelSchema, CompleteAIRouterNode, RelatedAIRouterNodeModelSchema, CompleteAIRouterLogs, RelatedAIRouterLogsModelSchema } from "./index.js"

export const AIRouterModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteAIRouter extends z.infer<typeof AIRouterModelSchema> {
  workspace: CompleteWorkspace
  tiers: CompleteAIRouterTier[]
  nodes: CompleteAIRouterNode[]
  logs: CompleteAIRouterLogs[]
}

/**
 * RelatedAIRouterModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAIRouterModelSchema: z.ZodSchema<CompleteAIRouter> = z.lazy(() => AIRouterModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  tiers: RelatedAIRouterTierModelSchema.array(),
  nodes: RelatedAIRouterNodeModelSchema.array(),
  logs: RelatedAIRouterLogsModelSchema.array(),
}))
