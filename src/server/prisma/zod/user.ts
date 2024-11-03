import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteAccount, RelatedAccountModelSchema, CompleteSession, RelatedSessionModelSchema, CompleteWorkspacesOnUsers, RelatedWorkspacesOnUsersModelSchema, CompleteUserApiKey, RelatedUserApiKeyModelSchema } from "./index.js"

export const UserModelSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  email: z.string().nullish(),
  emailVerified: z.date().nullish(),
  nickname: z.string().nullish(),
  avatar: z.string().nullish(),
  role: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullish(),
  currentWorkspaceId: z.string().nullish(),
})

export interface CompleteUser extends z.infer<typeof UserModelSchema> {
  accounts: CompleteAccount[]
  sessions: CompleteSession[]
  workspaces: CompleteWorkspacesOnUsers[]
  apiKeys: CompleteUserApiKey[]
}

/**
 * RelatedUserModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserModelSchema: z.ZodSchema<CompleteUser> = z.lazy(() => UserModelSchema.extend({
  accounts: RelatedAccountModelSchema.array(),
  sessions: RelatedSessionModelSchema.array(),
  workspaces: RelatedWorkspacesOnUsersModelSchema.array(),
  apiKeys: RelatedUserApiKeyModelSchema.array(),
}))
