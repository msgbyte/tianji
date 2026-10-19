import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteUser, RelatedUserModelSchema, CompleteSharedModuleRevision, RelatedSharedModuleRevisionModelSchema, CompleteFunctionWorkerModuleBinding, RelatedFunctionWorkerModuleBindingModelSchema, CompleteFunctionWorkerRevisionModuleBinding, RelatedFunctionWorkerRevisionModuleBindingModelSchema } from "./index.js"

export const SharedModuleModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  ownerId: z.string().nullish(),
  name: z.string(),
  description: z.string().nullish(),
  importAlias: z.string(),
  latestRevision: z.number().int(),
  archivedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteSharedModule extends z.infer<typeof SharedModuleModelSchema> {
  workspace: CompleteWorkspace
  owner?: CompleteUser | null
  revisions: CompleteSharedModuleRevision[]
  workerBindings: CompleteFunctionWorkerModuleBinding[]
  workerRevisionBindings: CompleteFunctionWorkerRevisionModuleBinding[]
}

/**
 * RelatedSharedModuleModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedSharedModuleModelSchema: z.ZodSchema<CompleteSharedModule> = z.lazy(() => SharedModuleModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  owner: RelatedUserModelSchema.nullish(),
  revisions: RelatedSharedModuleRevisionModelSchema.array(),
  workerBindings: RelatedFunctionWorkerModuleBindingModelSchema.array(),
  workerRevisionBindings: RelatedFunctionWorkerRevisionModuleBindingModelSchema.array(),
}))
