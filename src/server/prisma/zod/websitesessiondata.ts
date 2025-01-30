import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWebsite, RelatedWebsiteModelSchema, CompleteWebsiteSession, RelatedWebsiteSessionModelSchema } from "./index.js"

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
