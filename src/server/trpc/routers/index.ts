import { router } from '../trpc';
import { notificationRouter } from './notification';
import { websiteRouter } from './website';
import { monitorRouter } from './monitor';
import { userRouter } from './user';
import { workspaceRouter } from './workspace';
import { globalRouter } from './global';
import { serverStatusRouter } from './serverStatus';
import { auditLogRouter } from './auditLog';
import { billingRouter } from './billing';

export const appRouter = router({
  global: globalRouter,
  user: userRouter,
  workspace: workspaceRouter,
  website: websiteRouter,
  notification: notificationRouter,
  monitor: monitorRouter,
  serverStatus: serverStatusRouter,
  auditLog: auditLogRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
