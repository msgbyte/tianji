import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteFunctionWorker, RelatedFunctionWorkerModelSchema, CompleteSharedModule, RelatedSharedModuleModelSchema, CompleteSharedModuleRevision, RelatedSharedModuleRevisionModelSchema } from "./index.js"

export const FunctionWorkerModuleBindingModelSchema = z.object({
  id: z.string(),
  workerId: z.string(),
  moduleId: z.string(),
  moduleRevisionId: z.string(),
  importAlias: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteFunctionWorkerModuleBinding extends z.infer<typeof FunctionWorkerModuleBindingModelSchema> {
  worker: CompleteFunctionWorker
  module: CompleteSharedModule
  moduleRevision: CompleteSharedModuleRevision
}

/**
 * RelatedFunctionWorkerModuleBindingModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFunctionWorkerModuleBindingModelSchema: z.ZodSchema<CompleteFunctionWorkerModuleBinding> = z.lazy(() => FunctionWorkerModuleBindingModelSchema.extend({
  worker: RelatedFunctionWorkerModelSchema,
  module: RelatedSharedModuleModelSchema,
  moduleRevision: RelatedSharedModuleRevisionModelSchema,
}))
