import * as z from "zod"
import * as imports from "./schemas/index.js"
import { FunctionWorkerExecutionStatus } from "@prisma/client"
import { CompleteFunctionWorker, RelatedFunctionWorkerModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const FunctionWorkerExecutionModelSchema = z.object({
  id: z.string(),
  workerId: z.string(),
  status: z.nativeEnum(FunctionWorkerExecutionStatus),
  requestPayload: jsonSchema,
  responsePayload: jsonSchema,
  error: z.string().nullish(),
  duration: z.number().int().nullish(),
  memoryUsed: z.number().int().nullish(),
  cpuTime: z.number().int().nullish(),
  logs: jsonSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteFunctionWorkerExecution extends z.infer<typeof FunctionWorkerExecutionModelSchema> {
  worker: CompleteFunctionWorker
}

/**
 * RelatedFunctionWorkerExecutionModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFunctionWorkerExecutionModelSchema: z.ZodSchema<CompleteFunctionWorkerExecution> = z.lazy(() => FunctionWorkerExecutionModelSchema.extend({
  worker: RelatedFunctionWorkerModelSchema,
}))
