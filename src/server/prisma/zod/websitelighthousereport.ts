import * as z from "zod"
import * as imports from "./schemas/index.js"
import { WebsiteLighthouseReportStatus } from "@prisma/client"

export const WebsiteLighthouseReportModelSchema = z.object({
  id: z.string(),
  websiteId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  url: z.string(),
  result: z.string(),
  status: z.nativeEnum(WebsiteLighthouseReportStatus),
  performanceScore: z.number().int(),
  accessibilityScore: z.number().int(),
  bestPracticesScore: z.number().int(),
  seoScore: z.number().int(),
})
