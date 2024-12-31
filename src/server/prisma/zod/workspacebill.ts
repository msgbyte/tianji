import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const WorkspaceBillModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  type: z.string(),
  amount: z.number().int(),
  /**
   * [CommonPayload]
   */
  meta: imports.CommonPayloadSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteWorkspaceBill extends z.infer<typeof WorkspaceBillModelSchema> {
  workspace: CompleteWorkspace
}

/**
 * RelatedWorkspaceBillModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWorkspaceBillModelSchema: z.ZodSchema<CompleteWorkspaceBill> = z.lazy(() => WorkspaceBillModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
}))
