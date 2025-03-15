import * as z from "zod"
import * as imports from "./schemas/index.js"
import { CompleteWorkspace, RelatedWorkspaceModelSchema, CompleteApplicationSession, RelatedApplicationSessionModelSchema, CompleteApplicationEventData, RelatedApplicationEventDataModelSchema, CompleteApplicationSessionData, RelatedApplicationSessionDataModelSchema, CompleteApplicationStoreInfo, RelatedApplicationStoreInfoModelSchema } from "./index.js"

export const ApplicationModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullish(),
})

export interface CompleteApplication extends z.infer<typeof ApplicationModelSchema> {
  workspace: CompleteWorkspace
  sessions: CompleteApplicationSession[]
  eventData: CompleteApplicationEventData[]
  sessionData: CompleteApplicationSessionData[]
  applicationStoreInfos: CompleteApplicationStoreInfo[]
}

/**
 * RelatedApplicationModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedApplicationModelSchema: z.ZodSchema<CompleteApplication> = z.lazy(() => ApplicationModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
  sessions: RelatedApplicationSessionModelSchema.array(),
  eventData: RelatedApplicationEventDataModelSchema.array(),
  sessionData: RelatedApplicationSessionDataModelSchema.array(),
  applicationStoreInfos: RelatedApplicationStoreInfoModelSchema.array(),
}))
