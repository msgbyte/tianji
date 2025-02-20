import * as z from "zod"
import * as imports from "./schemas/index.js"
import { WorkspaceTaskEnum } from "@prisma/client"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const WorkspaceTaskModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  type: z.string(),
  status: z.nativeEnum(WorkspaceTaskEnum),
  /**
   * [CommonPayload]
   */
  meta: imports.CommonPayloadSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})
