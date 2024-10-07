import * as z from "zod"
import * as imports from "./schemas/index.js"
import { WorkspaceSubscriptionTier } from "@prisma/client"
import { CompleteWorkspace, RelatedWorkspaceModelSchema } from "./index.js"

export const WorkspaceSubscriptionModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  tier: z.nativeEnum(WorkspaceSubscriptionTier),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteWorkspaceSubscription extends z.infer<typeof WorkspaceSubscriptionModelSchema> {
  workspace: CompleteWorkspace
}

/**
 * RelatedWorkspaceSubscriptionModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWorkspaceSubscriptionModelSchema: z.ZodSchema<CompleteWorkspaceSubscription> = z.lazy(() => WorkspaceSubscriptionModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
}))
