import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteUser, RelatedUserModelSchema } from "./index.js"

export const UserApiKeyModelSchema = z.object({
  apiKey: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiredAt: z.date().nullish(),
})

export interface CompleteUserApiKey extends z.infer<typeof UserApiKeyModelSchema> {
  user: CompleteUser
}

/**
 * RelatedUserApiKeyModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserApiKeyModelSchema: z.ZodSchema<CompleteUserApiKey> = z.lazy(() => UserApiKeyModelSchema.extend({
  user: RelatedUserModelSchema,
}))
