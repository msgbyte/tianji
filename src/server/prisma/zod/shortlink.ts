import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteShortLinkAccess, RelatedShortLinkAccessModelSchema } from "./index.js"

export const ShortLinkModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  code: z.string(),
  originalUrl: z.string(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  enabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullish(),
})

export interface CompleteShortLink extends z.infer<typeof ShortLinkModelSchema> {
  workspace: CompleteWorkspace
  accesses: CompleteShortLinkAccess[]
}

/**
 * RelatedShortLinkModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedShortLinkModelSchema: z.ZodSchema<CompleteShortLink> = z.lazy(() => ShortLinkModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  accesses: RelatedShortLinkAccessModelSchema.array(),
}))
