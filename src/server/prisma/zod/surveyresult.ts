import * as z from "zod"
import * as imports from "./schemas"
import { CompleteSurvey, RelatedSurveyModelSchema } from "./index"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const SurveyResultModelSchema = z.object({
  id: z.string(),
  surveyId: z.string(),
  createdAt: z.date(),
  sessionId: z.string(),
  /**
   * [CommonPayload]
   */
  payload: imports.CommonPayloadSchema,
  browser: z.string().nullish(),
  os: z.string().nullish(),
  language: z.string().nullish(),
  ip: z.string().nullish(),
  country: z.string().nullish(),
  subdivision1: z.string().nullish(),
  subdivision2: z.string().nullish(),
  city: z.string().nullish(),
  longitude: z.number().nullish(),
  latitude: z.number().nullish(),
  accuracyRadius: z.number().int().nullish(),
})

export interface CompleteSurveyResult extends z.infer<typeof SurveyResultModelSchema> {
  survey: CompleteSurvey
}

/**
 * RelatedSurveyResultModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedSurveyResultModelSchema: z.ZodSchema<CompleteSurveyResult> = z.lazy(() => SurveyResultModelSchema.extend({
  survey: RelatedSurveyModelSchema,
}))
