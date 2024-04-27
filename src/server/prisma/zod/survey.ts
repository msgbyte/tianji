import * as z from "zod"
import * as imports from "./schemas"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteSurveyResult, RelatedSurveyResultModelSchema } from "./index"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const SurveyModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  /**
   * [SurveyPayload]
   */
  payload: imports.SurveyPayloadSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteSurvey extends z.infer<typeof SurveyModelSchema> {
  workspace: CompleteWorkspace
  surveyResultList: CompleteSurveyResult[]
}

/**
 * RelatedSurveyModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedSurveyModelSchema: z.ZodSchema<CompleteSurvey> = z.lazy(() => SurveyModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  surveyResultList: RelatedSurveyResultModelSchema.array(),
}))
