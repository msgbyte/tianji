import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteFunctionWorker, RelatedFunctionWorkerModelSchema } from "./index.js"

export const FunctionWorkerRevisionModelSchema = z.object({
  id: z.string(),
  workerId: z.string(),
  revision: z.number().int(),
  code: z.string(),
  createdAt: z.date(),
})

export interface CompleteFunctionWorkerRevision extends z.infer<typeof FunctionWorkerRevisionModelSchema> {
  worker: CompleteFunctionWorker
}

/**
 * RelatedFunctionWorkerRevisionModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFunctionWorkerRevisionModelSchema: z.ZodSchema<CompleteFunctionWorkerRevision> = z.lazy(() => FunctionWorkerRevisionModelSchema.extend({
  worker: RelatedFunctionWorkerModelSchema,
}))
