import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteUser, RelatedUserModelSchema } from "./index.js"

export const WorkspaceInvitationModelSchema = z.object({
  id: z.string(),
  email: z.string(),
  workspaceId: z.string(),
  inviterId: z.string(),
  role: z.string(),
  token: z.string(),
  status: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteWorkspaceInvitation extends z.infer<typeof WorkspaceInvitationModelSchema> {
  workspace: CompleteWorkspace
  inviter: CompleteUser
}

/**
 * RelatedWorkspaceInvitationModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWorkspaceInvitationModelSchema: z.ZodSchema<CompleteWorkspaceInvitation> = z.lazy(() => WorkspaceInvitationModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  inviter: RelatedUserModelSchema,
}))
