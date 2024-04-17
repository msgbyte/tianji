import * as z from "zod"
import * as imports from "./schemas"
import { CompleteWorkspace, RelatedWorkspaceModelSchema } from "./index"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const MonitorStatusPageModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  /**
   * [MonitorStatusPageList]
   */
  monitorList: imports.MonitorStatusPageListSchema,
  domain: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteMonitorStatusPage extends z.infer<typeof MonitorStatusPageModelSchema> {
  workspace: CompleteWorkspace
}

/**
 * RelatedMonitorStatusPageModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedMonitorStatusPageModelSchema: z.ZodSchema<CompleteMonitorStatusPage> = z.lazy(() => MonitorStatusPageModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
}))
