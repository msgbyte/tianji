import * as z from "zod"
import * as imports from "./schemas/index.js"

export const VerificationTokenModelSchema = z.object({
  identifier: z.string(),
  token: z.string(),
  expires: z.date(),
})
