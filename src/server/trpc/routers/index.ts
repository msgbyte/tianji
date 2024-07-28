import { router } from '../trpc.js';
import { notificationRouter } from './notification.js';
import { websiteRouter } from './website.js';
import { monitorRouter } from './monitor.js';
import { userRouter } from './user.js';
import { workspaceRouter } from './workspace.js';
import { globalRouter } from './global.js';
import { serverStatusRouter } from './serverStatus.js';
import { auditLogRouter } from './auditLog.js';
import { billingRouter } from './billing.js';
import { telemetryRouter } from './telemetry.js';
import { surveyRouter } from './survey.js';
import { feedRouter } from './feed/index.js';

export const appRouter = router({
  global: globalRouter,
  user: userRouter,
  workspace: workspaceRouter,
  website: websiteRouter,
  notification: notificationRouter,
  monitor: monitorRouter,
  telemetry: telemetryRouter,
  survey: surveyRouter,
  serverStatus: serverStatusRouter,
  auditLog: auditLogRouter,
  billing: billingRouter,
  feed: feedRouter,
});

export type AppRouter = typeof appRouter;
