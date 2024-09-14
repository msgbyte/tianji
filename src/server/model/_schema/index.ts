import { z } from 'zod';
import { MonitorModelSchema } from '../../prisma/zod/index.js';

// Match prisma `JsonValue`
export const jsonFieldSchema = z.union([
  z.null(),
  z.record(z.any()),
  z.array(z.any()),
  z.string(),
  z.boolean(),
  z.number(),
]);

export const workspaceDashboardLayoutSchema = z.object({
  layouts: z.record(z.string(), z.array(z.any())),
  items: z.array(z.any()),
});

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const userInfoSchema = z.object({
  id: z.string(),
  role: z.string(),
  username: z.string(),
  nickname: z.string().nullable(),
  avatar: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  currentWorkspaceId: z.string().nullable(),
  workspaces: z.array(
    z.object({
      role: z.string(),
      workspace: workspaceSchema,
    })
  ),
});

export const websiteInfoSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  domain: z.string().nullable(),
  shareId: z.string().nullable(),
  resetAt: z.date().nullable(),
  monitorId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export const monitorInfoWithNotificationIdSchema = MonitorModelSchema.merge(
  z.object({
    notifications: z.array(z.object({ id: z.string() })),
  })
);

export const monitorEventSchema = z.object({
  id: z.string(),
  message: z.string(),
  monitorId: z.string(),
  type: z.string(),
  createdAt: z.date(),
});

export const monitorStatusSchema = z.object({
  monitorId: z.string(),
  statusName: z.string(),
  payload: jsonFieldSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
