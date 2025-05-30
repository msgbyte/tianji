import * as z from "zod"
import * as imports from "./schemas/index.js"
import { AIGatewayLogsStatus } from "@prisma/client"
import { CompleteAIGateway, RelatedAIGatewayModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const AIGatewayLogsModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  gatewayId: z.string(),
  inputToken: z.number().int(),
  outputToken: z.number().int(),
  stream: z.boolean(),
  modelName: z.string(),
  status: z.nativeEnum(AIGatewayLogsStatus),
  duration: z.number().int(),
  ttft: z.number().int(),
  price: z.number(),
  requestPayload: jsonSchema,
  responsePayload: jsonSchema,
  userId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteAIGatewayLogs extends z.infer<typeof AIGatewayLogsModelSchema> {
  gateway: CompleteAIGateway
}

/**
 * RelatedAIGatewayLogsModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAIGatewayLogsModelSchema: z.ZodSchema<CompleteAIGatewayLogs> = z.lazy(() => AIGatewayLogsModelSchema.extend({
  gateway: RelatedAIGatewayModelSchema,
}))
