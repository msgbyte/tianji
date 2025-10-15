import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema)]))

export const WorkspaceConfigModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  key: z.string(),
  /**
   * [CommonPayload]
   */
  value: imports.CommonPayloadSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteWorkspaceConfig extends z.infer<typeof WorkspaceConfigModelSchema> {
  workspace: CompleteWorkspace
}

/**
 * RelatedWorkspaceConfigModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWorkspaceConfigModelSchema: z.ZodSchema<CompleteWorkspaceConfig> = z.lazy(() => WorkspaceConfigModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
}))
