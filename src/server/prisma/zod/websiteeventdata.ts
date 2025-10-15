import * as z from "zod"
import * as imports from "./schemas/index.js"
import { Decimal } from "decimal.js"
import { CompleteWebsite, RelatedWebsiteModelSchema, CompleteWebsiteEvent, RelatedWebsiteEventModelSchema } from "./index.js"

// Helper schema for Decimal fields
z
  .instanceof(Decimal)
  .or(z.string())
  .or(z.number())
  .refine((value) => {
    try {
      return new Decimal(value)
    } catch (error) {
      return false
    }
  })
  .transform((value) => new Decimal(value))

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
