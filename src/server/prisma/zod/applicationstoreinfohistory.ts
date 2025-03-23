import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteApplication, RelatedApplicationModelSchema } from "./index.js"

export const ApplicationStoreInfoHistoryModelSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  storeType: z.string(),
  storeId: z.string(),
  appId: z.string(),
  title: z.string(),
  description: z.string(),
  releaseNotes: z.string(),
  url: z.string(),
  downloads: z.number().int().nullish(),
  score: z.number().nullish(),
  ratingCount: z.number().int().nullish(),
  reviews: z.number().int().nullish(),
  version: z.string().nullish(),
  size: z.number().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteApplicationStoreInfoHistory extends z.infer<typeof ApplicationStoreInfoHistoryModelSchema> {
  application: CompleteApplication
}

/**
 * RelatedApplicationStoreInfoHistoryModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedApplicationStoreInfoHistoryModelSchema: z.ZodSchema<CompleteApplicationStoreInfoHistory> = z.lazy(() => ApplicationStoreInfoHistoryModelSchema.extend({
  application: RelatedApplicationModelSchema,
}))
