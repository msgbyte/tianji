import * as z from "zod"
import * as imports from "./schemas"
import { CompleteWebsite, RelatedWebsiteModelSchema, CompleteWebsiteEvent, RelatedWebsiteEventModelSchema, CompleteWebsiteSessionData, RelatedWebsiteSessionDataModelSchema } from "./index"

export const WebsiteSessionModelSchema = z.object({
  id: z.string(),
  websiteId: z.string(),
  hostname: z.string().nullish(),
  browser: z.string().nullish(),
  os: z.string().nullish(),
  device: z.string().nullish(),
  screen: z.string().nullish(),
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

export interface CompleteWebsiteSession extends z.infer<typeof WebsiteSessionModelSchema> {
  website: CompleteWebsite
  websiteEvent: CompleteWebsiteEvent[]
  sessionData: CompleteWebsiteSessionData[]
}

/**
 * RelatedWebsiteSessionModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWebsiteSessionModelSchema: z.ZodSchema<CompleteWebsiteSession> = z.lazy(() => WebsiteSessionModelSchema.extend({
  website: RelatedWebsiteModelSchema,
  websiteEvent: RelatedWebsiteEventModelSchema.array(),
  sessionData: RelatedWebsiteSessionDataModelSchema.array(),
}))
