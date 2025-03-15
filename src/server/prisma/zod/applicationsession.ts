import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteApplication, RelatedApplicationModelSchema, CompleteApplicationEvent, RelatedApplicationEventModelSchema, CompleteApplicationSessionData, RelatedApplicationSessionDataModelSchema } from "./index.js"

export const ApplicationSessionModelSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
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
  createdAt: z.date(),
})

export interface CompleteApplicationSession extends z.infer<typeof ApplicationSessionModelSchema> {
  application: CompleteApplication
  applicationEvent: CompleteApplicationEvent[]
  sessionData: CompleteApplicationSessionData[]
}

/**
 * RelatedApplicationSessionModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedApplicationSessionModelSchema: z.ZodSchema<CompleteApplicationSession> = z.lazy(() => ApplicationSessionModelSchema.extend({
  application: RelatedApplicationModelSchema,
  applicationEvent: RelatedApplicationEventModelSchema.array(),
  sessionData: RelatedApplicationSessionDataModelSchema.array(),
}))
