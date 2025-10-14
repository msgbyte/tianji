import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteShortLink, RelatedShortLinkModelSchema } from "./index.js"

export const ShortLinkAccessModelSchema = z.object({
  id: z.string(),
  shortLinkId: z.string(),
  ip: z.string().nullish(),
  country: z.string().nullish(),
  subdivision1: z.string().nullish(),
  subdivision2: z.string().nullish(),
  city: z.string().nullish(),
  longitude: z.number().nullish(),
  latitude: z.number().nullish(),
  accuracyRadius: z.number().int().nullish(),
  browser: z.string().nullish(),
  os: z.string().nullish(),
  device: z.string().nullish(),
  language: z.string().nullish(),
  referrer: z.string().nullish(),
  userAgent: z.string().nullish(),
  createdAt: z.date(),
})

export interface CompleteShortLinkAccess extends z.infer<typeof ShortLinkAccessModelSchema> {
  shortLink: CompleteShortLink
}

/**
 * RelatedShortLinkAccessModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedShortLinkAccessModelSchema: z.ZodSchema<CompleteShortLinkAccess> = z.lazy(() => ShortLinkAccessModelSchema.extend({
  shortLink: RelatedShortLinkModelSchema,
}))
