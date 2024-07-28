import * as z from "zod"
import * as imports from "./schemas/index.js"
import { WorkspaceAuditLogType } from "@prisma/client"
import { CompleteWorkspace, RelatedWorkspaceModelSchema } from "./index.js"

export const WorkspaceAuditLogModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  content: z.string(),
  relatedId: z.string().nullish(),
  relatedType: z.nativeEnum(WorkspaceAuditLogType).nullish(),
  createdAt: z.date(),
})

export interface CompleteWorkspaceAuditLog extends z.infer<typeof WorkspaceAuditLogModelSchema> {
  workspace: CompleteWorkspace
}

/**
 * RelatedWorkspaceAuditLogModelSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWorkspaceAuditLogModelSchema: z.ZodSchema<CompleteWorkspaceAuditLog> = z.lazy(() => WorkspaceAuditLogModelSchema.extend({
  workspace: RelatedWorkspaceModelSchema,
}))
