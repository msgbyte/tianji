import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteAIGatewayLogs, RelatedAIGatewayLogsModelSchema } from "./index.js"

export const AIGatewayModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  modelApiKey: z.string().nullish(),
  customModelBaseUrl: z.string().nullish(),
  customModelName: z.string().nullish(),
  customModelInputPrice: z.number().nullish(),
  customModelOutputPrice: z.number().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteAIGateway extends z.infer<typeof AIGatewayModelSchema> {
  aiGatewayLogs: CompleteAIGatewayLogs[]
}

/**
 * RelatedAIGatewayModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAIGatewayModelSchema: z.ZodSchema<CompleteAIGateway> = z.lazy(() => AIGatewayModelSchema.extend({
  aiGatewayLogs: RelatedAIGatewayLogsModelSchema.array(),
}))
