import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteFunctionWorkerRevision, RelatedFunctionWorkerRevisionModelSchema, CompleteSharedModule, RelatedSharedModuleModelSchema, CompleteSharedModuleRevision, RelatedSharedModuleRevisionModelSchema } from "./index.js"

export const FunctionWorkerRevisionModuleBindingModelSchema = z.object({
  id: z.string(),
  workerRevisionId: z.string(),
  moduleId: z.string(),
  moduleRevisionId: z.string(),
  importAlias: z.string(),
})

export interface CompleteFunctionWorkerRevisionModuleBinding extends z.infer<typeof FunctionWorkerRevisionModuleBindingModelSchema> {
  workerRevision: CompleteFunctionWorkerRevision
  module: CompleteSharedModule
  moduleRevision: CompleteSharedModuleRevision
}

/**
 * RelatedFunctionWorkerRevisionModuleBindingModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFunctionWorkerRevisionModuleBindingModelSchema: z.ZodSchema<CompleteFunctionWorkerRevisionModuleBinding> = z.lazy(() => FunctionWorkerRevisionModuleBindingModelSchema.extend({
  workerRevision: RelatedFunctionWorkerRevisionModelSchema,
  module: RelatedSharedModuleModelSchema,
  moduleRevision: RelatedSharedModuleRevisionModelSchema,
}))
