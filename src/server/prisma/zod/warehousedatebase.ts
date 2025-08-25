import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema } from "./index.js"

export const WarehouseDatebaseModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  description: z.string(),
  connectionUri: z.string(),
  dbDriver: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteWarehouseDatebase extends z.infer<typeof WarehouseDatebaseModelSchema> {
  workspace: CompleteWorkspace
}

/**
 * RelatedWarehouseDatebaseModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWarehouseDatebaseModelSchema: z.ZodSchema<CompleteWarehouseDatebase> = z.lazy(() => WarehouseDatebaseModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
}))
