import * as z from "zod"
import * as imports from "./schemas/index.js"

export const LemonSqueezySubscriptionModelSchema = z.object({
  subscriptionId: z.string(),
  workspaceId: z.string(),
  storeId: z.string(),
  productId: z.string(),
  variantId: z.string(),
  status: z.string(),
  cardBrand: z.string(),
  cardLastFour: z.string(),
  renewsAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
