import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteWarehouseDatabaseTable, RelatedWarehouseDatabaseTableModelSchema } from "./index.js"

export const WarehouseDatabaseModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  description: z.string(),
  connectionUri: z.string(),
  dbDriver: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteWarehouseDatabase extends z.infer<typeof WarehouseDatabaseModelSchema> {
  workspace: CompleteWorkspace
  WarehouseDatabaseTable: CompleteWarehouseDatabaseTable[]
}

/**
 * RelatedWarehouseDatabaseModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWarehouseDatabaseModelSchema: z.ZodSchema<CompleteWarehouseDatabase> = z.lazy(() => WarehouseDatabaseModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  WarehouseDatabaseTable: RelatedWarehouseDatabaseTableModelSchema.array(),
}))
