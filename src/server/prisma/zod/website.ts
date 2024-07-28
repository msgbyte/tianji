import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteMonitor, RelatedMonitorModelSchema, CompleteWebsiteSession, RelatedWebsiteSessionModelSchema, CompleteWebsiteEventData, RelatedWebsiteEventDataModelSchema, CompleteWebsiteSessionData, RelatedWebsiteSessionDataModelSchema } from "./index.js"

export const WebsiteModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  domain: z.string().nullish(),
  shareId: z.string().nullish(),
  resetAt: z.date().nullish(),
  monitorId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullish(),
})

export interface CompleteWebsite extends z.infer<typeof WebsiteModelSchema> {
  workspace: CompleteWorkspace
  monitor?: CompleteMonitor | null
  sessions: CompleteWebsiteSession[]
  eventData: CompleteWebsiteEventData[]
  sessionData: CompleteWebsiteSessionData[]
}

/**
 * RelatedWebsiteModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWebsiteModelSchema: z.ZodSchema<CompleteWebsite> = z.lazy(() => WebsiteModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  monitor: RelatedMonitorModelSchema.nullish(),
  sessions: RelatedWebsiteSessionModelSchema.array(),
  eventData: RelatedWebsiteEventDataModelSchema.array(),
  sessionData: RelatedWebsiteSessionDataModelSchema.array(),
}))
