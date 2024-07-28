import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWebsite, RelatedWebsiteModelSchema, CompleteWebsiteEvent, RelatedWebsiteEventModelSchema } from "./index.js"

export const WebsiteEventDataModelSchema = z.object({
  id: z.string(),
  websiteId: z.string(),
  websiteEventId: z.string(),
  eventKey: z.string(),
  stringValue: z.string().nullish(),
  numberValue: z.number().nullish(),
  dateValue: z.date().nullish(),
  dataType: z.number().int(),
  createdAt: z.date(),
})

export interface CompleteWebsiteEventData extends z.infer<typeof WebsiteEventDataModelSchema> {
  website: CompleteWebsite
  websiteEvent: CompleteWebsiteEvent
}

/**
 * RelatedWebsiteEventDataModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWebsiteEventDataModelSchema: z.ZodSchema<CompleteWebsiteEventData> = z.lazy(() => WebsiteEventDataModelSchema.extend({
  website: RelatedWebsiteModelSchema,
  websiteEvent: RelatedWebsiteEventModelSchema,
}))
