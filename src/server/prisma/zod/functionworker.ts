import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteFunctionWorkerExecution, RelatedFunctionWorkerExecutionModelSchema } from "./index.js"

export const FunctionWorkerModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  code: z.string(),
  active: z.boolean(),
  enableCron: z.boolean(),
  cronExpression: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteFunctionWorker extends z.infer<typeof FunctionWorkerModelSchema> {
  workspace: CompleteWorkspace
  executions: CompleteFunctionWorkerExecution[]
}

/**
 * RelatedFunctionWorkerModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFunctionWorkerModelSchema: z.ZodSchema<CompleteFunctionWorker> = z.lazy(() => FunctionWorkerModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  executions: RelatedFunctionWorkerExecutionModelSchema.array(),
}))
