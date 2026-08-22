import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteSharedModule, RelatedSharedModuleModelSchema, CompleteUser, RelatedUserModelSchema, CompleteFunctionWorkerModuleBinding, RelatedFunctionWorkerModuleBindingModelSchema, CompleteFunctionWorkerRevisionModuleBinding, RelatedFunctionWorkerRevisionModuleBindingModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema)]))

export const SharedModuleRevisionModelSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  operatorId: z.string().nullish(),
  revision: z.number().int(),
  source: z.string(),
  compiledCode: z.string(),
  declarationCode: z.string(),
  exportsMetadata: jsonSchema,
  compilerVersion: z.string(),
  createdAt: z.date(),
})

export interface CompleteSharedModuleRevision extends z.infer<typeof SharedModuleRevisionModelSchema> {
  module: CompleteSharedModule
  operator?: CompleteUser | null
  workerBindings: CompleteFunctionWorkerModuleBinding[]
  workerRevisionBindings: CompleteFunctionWorkerRevisionModuleBinding[]
}

/**
 * RelatedSharedModuleRevisionModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedSharedModuleRevisionModelSchema: z.ZodSchema<CompleteSharedModuleRevision> = z.lazy(() => SharedModuleRevisionModelSchema.extend({
  module: RelatedSharedModuleModelSchema,
  operator: RelatedUserModelSchema.nullish(),
  workerBindings: RelatedFunctionWorkerModuleBindingModelSchema.array(),
  workerRevisionBindings: RelatedFunctionWorkerRevisionModuleBindingModelSchema.array(),
}))
