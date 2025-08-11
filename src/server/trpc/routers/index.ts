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
import { aiRouter } from './ai.js';
import { insightsRouter } from './insights/index.js';
import { applicationRouter } from './application.js';
import { aiGatewayRouter } from './aiGateway.js';
import { workerRouter } from './worker.js';

export const appRouter = router({
  ai: aiRouter,
  aiGateway: aiGatewayRouter,
  global: globalRouter,
  user: userRouter,
  workspace: workspaceRouter,
  website: websiteRouter,
  application: applicationRouter,
  insights: insightsRouter,
  notification: notificationRouter,
  monitor: monitorRouter,
  telemetry: telemetryRouter,
  survey: surveyRouter,
  serverStatus: serverStatusRouter,
  auditLog: auditLogRouter,
  billing: billingRouter,
  feed: feedRouter,
  worker: workerRouter,
});

export type AppRouter = typeof appRouter;
