import * as z from "zod"
import * as imports from "./schemas/index.js"
import { AIRouterLogsStatus } from "@prisma/client"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteAIRouter, RelatedAIRouterModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema)]))

export const AIRouterLogsModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  routerId: z.string(),
  protocol: z.string(),
  status: z.nativeEnum(AIRouterLogsStatus),
  finalGatewayId: z.string().nullish(),
  finalGatewayLogId: z.string().nullish(),
  attemptGatewayIds: z.string().array(),
  attemptGatewayLogIds: z.string().array(),
  /**
   * [Nullable<PrismaJson.CommonPayload[]>]
   */
  attemptErrors: imports.CommonPayloadSchema.array().nullish(),
  attemptCount: z.number().int(),
  duration: z.number().int(),
  createdAt: z.date(),
})

export interface CompleteAIRouterLogs extends z.infer<typeof AIRouterLogsModelSchema> {
  workspace: CompleteWorkspace
  router: CompleteAIRouter
}

/**
 * RelatedAIRouterLogsModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAIRouterLogsModelSchema: z.ZodSchema<CompleteAIRouterLogs> = z.lazy(() => AIRouterLogsModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  router: RelatedAIRouterModelSchema,
}))
