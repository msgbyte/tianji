import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteUser, RelatedUserModelSchema } from "./index.js"

export const AccountModelSchema = z.object({
  userId: z.string(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refresh_token: z.string().nullish(),
  access_token: z.string().nullish(),
  expires_at: z.number().int().nullish(),
  token_type: z.string().nullish(),
  scope: z.string().nullish(),
  id_token: z.string().nullish(),
  session_state: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteAccount extends z.infer<typeof AccountModelSchema> {
  user: CompleteUser
}

/**
 * RelatedAccountModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAccountModelSchema: z.ZodSchema<CompleteAccount> = z.lazy(() => AccountModelSchema.extend({
  user: RelatedUserModelSchema,
}))
