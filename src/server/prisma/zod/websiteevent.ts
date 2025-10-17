import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWebsiteEventData, RelatedWebsiteEventDataModelSchema, CompleteWebsiteSession, RelatedWebsiteSessionModelSchema } from "./index.js"

export const WebsiteEventModelSchema = z.object({
  id: z.string(),
  websiteId: z.string(),
  sessionId: z.string(),
  urlPath: z.string(),
  urlQuery: z.string().nullish(),
  referrerPath: z.string().nullish(),
  referrerQuery: z.string().nullish(),
  referrerDomain: z.string().nullish(),
  utmSource: z.string().nullish(),
  utmMedium: z.string().nullish(),
  utmCampaign: z.string().nullish(),
  utmTerm: z.string().nullish(),
  utmContent: z.string().nullish(),
  pageTitle: z.string().nullish(),
  eventType: z.number().int(),
  eventName: z.string().nullish(),
  createdAt: z.date(),
})

export interface CompleteWebsiteEvent extends z.infer<typeof WebsiteEventModelSchema> {
  eventData: CompleteWebsiteEventData[]
  session: CompleteWebsiteSession
}

/**
 * RelatedWebsiteEventModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWebsiteEventModelSchema: z.ZodSchema<CompleteWebsiteEvent> = z.lazy(() => WebsiteEventModelSchema.extend({
  eventData: RelatedWebsiteEventDataModelSchema.array(),
  session: RelatedWebsiteSessionModelSchema,
}))
