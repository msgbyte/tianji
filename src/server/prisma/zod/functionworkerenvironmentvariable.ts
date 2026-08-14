import * as z from "zod"
import * as imports from "./schemas/index.js"
import { FunctionWorkerEnvironmentVariableType } from "@prisma/client"
import { CompleteFunctionWorker, RelatedFunctionWorkerModelSchema } from "./index.js"

export const FunctionWorkerEnvironmentVariableModelSchema = z.object({
  id: z.string(),
  workerId: z.string(),
  key: z.string(),
  type: z.nativeEnum(FunctionWorkerEnvironmentVariableType),
  value: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteFunctionWorkerEnvironmentVariable extends z.infer<typeof FunctionWorkerEnvironmentVariableModelSchema> {
  worker: CompleteFunctionWorker
}

/**
 * RelatedFunctionWorkerEnvironmentVariableModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFunctionWorkerEnvironmentVariableModelSchema: z.ZodSchema<CompleteFunctionWorkerEnvironmentVariable> = z.lazy(() => FunctionWorkerEnvironmentVariableModelSchema.extend({
  worker: RelatedFunctionWorkerModelSchema,
}))
