import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteApplication, RelatedApplicationModelSchema } from "./index.js"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema)]))

export const ApplicationUserModelSchema = z.object({
  applicationId: z.string(),
  userId: z.string(),
  properties: jsonSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteApplicationUser extends z.infer<typeof ApplicationUserModelSchema> {
  application: CompleteApplication
}

/**
 * RelatedApplicationUserModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedApplicationUserModelSchema: z.ZodSchema<CompleteApplicationUser> = z.lazy(() => ApplicationUserModelSchema.extend({
  application: RelatedApplicationModelSchema,
}))
