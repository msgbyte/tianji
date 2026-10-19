import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteAIRouter, RelatedAIRouterModelSchema, CompleteAIRouterTier, RelatedAIRouterTierModelSchema, CompleteAIGateway, RelatedAIGatewayModelSchema } from "./index.js"

export const AIRouterNodeModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  routerId: z.string(),
  tierId: z.string(),
  gatewayId: z.string(),
  provider: z.string(),
  order: z.number().int(),
  enabled: z.boolean(),
  weight: z.number().int(),
  modelOverride: z.string().nullish(),
  timeoutMs: z.number().int(),
  retryableStatusCodes: z.number().int().array(),
  failOnEmptyContent: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteAIRouterNode extends z.infer<typeof AIRouterNodeModelSchema> {
  workspace: CompleteWorkspace
  router: CompleteAIRouter
  tier: CompleteAIRouterTier
  gateway: CompleteAIGateway
}

/**
 * RelatedAIRouterNodeModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAIRouterNodeModelSchema: z.ZodSchema<CompleteAIRouterNode> = z.lazy(() => AIRouterNodeModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  router: RelatedAIRouterModelSchema,
  tier: RelatedAIRouterTierModelSchema,
  gateway: RelatedAIGatewayModelSchema,
}))
