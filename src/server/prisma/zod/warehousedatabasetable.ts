import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteWarehouseDatabase, RelatedWarehouseDatabaseModelSchema } from "./index.js"

export const WarehouseDatabaseTableModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  databaseId: z.string(),
  name: z.string(),
  description: z.string(),
  ddl: z.string(),
  prompt: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteWarehouseDatabaseTable extends z.infer<typeof WarehouseDatabaseTableModelSchema> {
  workspace: CompleteWorkspace
  database: CompleteWarehouseDatabase
}

/**
 * RelatedWarehouseDatabaseTableModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWarehouseDatabaseTableModelSchema: z.ZodSchema<CompleteWarehouseDatabaseTable> = z.lazy(() => WarehouseDatabaseTableModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  database: RelatedWarehouseDatabaseModelSchema,
}))
