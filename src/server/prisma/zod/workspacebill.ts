import * as z from "zod"
import * as imports from "./schemas/index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema)]))

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
