import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteAIRouter, RelatedAIRouterModelSchema, CompleteAIRouterNode, RelatedAIRouterNodeModelSchema } from "./index.js"

export const AIRouterTierModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  routerId: z.string(),
  order: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteAIRouterTier extends z.infer<typeof AIRouterTierModelSchema> {
  workspace: CompleteWorkspace
  router: CompleteAIRouter
  nodes: CompleteAIRouterNode[]
}

/**
 * RelatedAIRouterTierModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAIRouterTierModelSchema: z.ZodSchema<CompleteAIRouterTier> = z.lazy(() => AIRouterTierModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  router: RelatedAIRouterModelSchema,
  nodes: RelatedAIRouterNodeModelSchema.array(),
}))
