import { router } from '../trpc';
import { notificationRouter } from './notification';
import { websiteRouter } from './website';
import { monitorRouter } from './monitor';
import { userRouter } from './user';
import { workspaceRouter } from './workspace';
import { globalRouter } from './global';
import { serverStatusRouter } from './serverStatus';
import { auditLogRouter } from './auditLog';

export const appRouter = router({
  global: globalRouter,
  user: userRouter,
  workspace: workspaceRouter,
  website: websiteRouter,
  notification: notificationRouter,
  monitor: monitorRouter,
  serverStatus: serverStatusRouter,
  auditLog: auditLogRouter,
});

export type AppRouter = typeof appRouter;
