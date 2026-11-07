import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteUser, RelatedUserModelSchema } from "./index.js"

export const ArtifactModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  description: z.string(),
  source: z.string(),
  revision: z.number().int(),
  createdById: z.string().nullish(),
  updatedById: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteArtifact extends z.infer<typeof ArtifactModelSchema> {
  workspace: CompleteWorkspace
  createdBy?: CompleteUser | null
  updatedBy?: CompleteUser | null
}

/**
 * RelatedArtifactModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedArtifactModelSchema: z.ZodSchema<CompleteArtifact> = z.lazy(() => ArtifactModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  createdBy: RelatedUserModelSchema.nullish(),
  updatedBy: RelatedUserModelSchema.nullish(),
}))
