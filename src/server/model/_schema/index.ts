import { z } from 'zod';

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  dashboardOrder: z.array(z.string()),
});

export const userInfoSchema = z.object({
  username: z.string(),
  id: z.string(),
  role: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  currentWorkspace: workspaceSchema.nullable(),
  workspaces: z.array(
    z.object({
      role: z.string(),
      workspace: workspaceSchema,
    })
  ),
});
