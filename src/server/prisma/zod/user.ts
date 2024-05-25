import * as z from "zod"
import * as imports from "./schemas"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteAccount, RelatedAccountModelSchema, CompleteSession, RelatedSessionModelSchema, CompleteWorkspacesOnUsers, RelatedWorkspacesOnUsersModelSchema } from "./index"

export const UserModelSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  email: z.string().nullish(),
  emailVerified: z.date().nullish(),
  image: z.string().nullish(),
  username: z.string(),
  password: z.string(),
  role: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullish(),
  currentWorkspaceId: z.string(),
})

export interface CompleteUser extends z.infer<typeof UserModelSchema> {
  currentWorkspace: CompleteWorkspace
  accounts: CompleteAccount[]
  sessions: CompleteSession[]
  workspaces: CompleteWorkspacesOnUsers[]
}

/**
 * RelatedUserModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserModelSchema: z.ZodSchema<CompleteUser> = z.lazy(() => UserModelSchema.extend({
  currentWorkspace: RelatedWorkspaceModelSchema,
  accounts: RelatedAccountModelSchema.array(),
  sessions: RelatedSessionModelSchema.array(),
  workspaces: RelatedWorkspacesOnUsersModelSchema.array(),
}))
