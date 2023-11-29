import * as z from "zod"
import { CompleteUser, RelatedUserModelSchema, CompleteWorkspace, RelatedWorkspaceModelSchema } from "./index"

export const WorkspacesOnUsersModelSchema = z.object({
  userId: z.string(),
  workspaceId: z.string(),
  role: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteWorkspacesOnUsers extends z.infer<typeof WorkspacesOnUsersModelSchema> {
  user: CompleteUser
  workspace: CompleteWorkspace
}

/**
 * RelatedWorkspacesOnUsersModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWorkspacesOnUsersModelSchema: z.ZodSchema<CompleteWorkspacesOnUsers> = z.lazy(() => WorkspacesOnUsersModelSchema.extend({
  user: RelatedUserModelSchema,
  workspace: RelatedWorkspaceModelSchema,
}))
