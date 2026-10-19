import * as z from "zod"
import * as imports from "./schemas/index.js"
import { Decimal } from "decimal.js"
import { CompleteAIGatewayLogs, RelatedAIGatewayLogsModelSchema, CompleteAIGatewayQuotaAlert, RelatedAIGatewayQuotaAlertModelSchema, CompleteAIRouterNode, RelatedAIRouterNodeModelSchema, CompleteWorkspace, RelatedWorkspaceModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema)]))

// Helper schema for Decimal fields
z
  .instanceof(Decimal)
  .or(z.string())
  .or(z.number())
  .refine((value) => {
    try {
      return new Decimal(value)
    } catch (error) {
      return false
    }
  })
  .transform((value) => new Decimal(value))

export const AIGatewayModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  modelApiKey: z.string().nullish(),
  customModelBaseUrl: z.string().nullish(),
  customModelName: z.string().nullish(),
  /**
   * [Nullable<PrismaJson.CommonPayload>]
   */
  customModelStrategy: imports.CommonPayloadSchema.nullish(),
  customModelInputPrice: z.number().nullish(),
  customModelOutputPrice: z.number().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteAIGateway extends z.infer<typeof AIGatewayModelSchema> {
  aiGatewayLogs: CompleteAIGatewayLogs[]
  aiGatewayQuotaAlerts: CompleteAIGatewayQuotaAlert[]
  aiRouterNodes: CompleteAIRouterNode[]
  workspace: CompleteWorkspace
}

/**
 * RelatedAIGatewayModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAIGatewayModelSchema: z.ZodSchema<CompleteAIGateway> = z.lazy(() => AIGatewayModelSchema.extend({
  aiGatewayLogs: RelatedAIGatewayLogsModelSchema.array(),
  aiGatewayQuotaAlerts: RelatedAIGatewayQuotaAlertModelSchema.array(),
  aiRouterNodes: RelatedAIRouterNodeModelSchema.array(),
  workspace: RelatedWorkspaceModelSchema,
}))
