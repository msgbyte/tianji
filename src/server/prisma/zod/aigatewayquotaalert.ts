import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteAIGateway, RelatedAIGatewayModelSchema, CompleteNotification, RelatedNotificationModelSchema } from "./index.js"

export const AIGatewayQuotaAlertModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  gatewayId: z.string(),
  dailyQuota: z.number(),
  enabled: z.boolean(),
  notificationId: z.string().nullish(),
  lastAlertSentAt: z.date().nullish(),
  alertLevel80Sent: z.boolean(),
  alertLevel100Sent: z.boolean(),
  alertLevel150Sent: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteAIGatewayQuotaAlert extends z.infer<typeof AIGatewayQuotaAlertModelSchema> {
  workspace: CompleteWorkspace
  aiGateway: CompleteAIGateway
  notification?: CompleteNotification | null
}

/**
 * RelatedAIGatewayQuotaAlertModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAIGatewayQuotaAlertModelSchema: z.ZodSchema<CompleteAIGatewayQuotaAlert> = z.lazy(() => AIGatewayQuotaAlertModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  aiGateway: RelatedAIGatewayModelSchema,
  notification: RelatedNotificationModelSchema.nullish(),
}))
