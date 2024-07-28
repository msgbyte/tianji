import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteUser, RelatedUserModelSchema } from "./index.js"

export const SessionModelSchema = z.object({
  sessionToken: z.string(),
  userId: z.string(),
  expires: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteSession extends z.infer<typeof SessionModelSchema> {
  user: CompleteUser
}

/**
 * RelatedSessionModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedSessionModelSchema: z.ZodSchema<CompleteSession> = z.lazy(() => SessionModelSchema.extend({
  user: RelatedUserModelSchema,
}))
