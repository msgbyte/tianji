import * as z from "zod"
import * as imports from "./schemas/index.js"
import { FunctionWorkerVisibility } from "@prisma/client"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteFunctionWorkerExecution, RelatedFunctionWorkerExecutionModelSchema, CompleteFunctionWorkerRevision, RelatedFunctionWorkerRevisionModelSchema } from "./index.js"

export const FunctionWorkerModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  code: z.string(),
  revision: z.number().int(),
  active: z.boolean(),
  enableCron: z.boolean(),
  cronExpression: z.string().nullish(),
  visibility: z.nativeEnum(FunctionWorkerVisibility),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteFunctionWorker extends z.infer<typeof FunctionWorkerModelSchema> {
  workspace: CompleteWorkspace
  executions: CompleteFunctionWorkerExecution[]
  revisions: CompleteFunctionWorkerRevision[]
}

/**
 * RelatedFunctionWorkerModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFunctionWorkerModelSchema: z.ZodSchema<CompleteFunctionWorker> = z.lazy(() => FunctionWorkerModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  executions: RelatedFunctionWorkerExecutionModelSchema.array(),
  revisions: RelatedFunctionWorkerRevisionModelSchema.array(),
}))
