import * as z from "zod"
import * as imports from "./schemas/index.js"
import { TransactionStatus } from "@prisma/client"

export const LemonSqueezyTransactionModelSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workspaceId: z.string(),
  checkoutId: z.string(),
  status: z.nativeEnum(TransactionStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
})
