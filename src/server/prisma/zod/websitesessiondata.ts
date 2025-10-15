import * as z from "zod"
import * as imports from "./schemas/index.js"
import { Decimal } from "decimal.js"
import { CompleteWebsite, RelatedWebsiteModelSchema, CompleteWebsiteSession, RelatedWebsiteSessionModelSchema } from "./index.js"

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

export const WebsiteSessionDataModelSchema = z.object({
  id: z.string(),
  websiteId: z.string(),
  sessionId: z.string(),
  key: z.string(),
  stringValue: z.string().nullish(),
  numberValue: z.number().nullish(),
  dateValue: z.date().nullish(),
  dataType: z.number().int(),
  createdAt: z.date(),
})

export interface CompleteWebsiteSessionData extends z.infer<typeof WebsiteSessionDataModelSchema> {
  website: CompleteWebsite
  session: CompleteWebsiteSession
}

/**
 * RelatedWebsiteSessionDataModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWebsiteSessionDataModelSchema: z.ZodSchema<CompleteWebsiteSessionData> = z.lazy(() => WebsiteSessionDataModelSchema.extend({
  website: RelatedWebsiteModelSchema,
  session: RelatedWebsiteSessionModelSchema,
}))
