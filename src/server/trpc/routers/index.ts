import { router } from '../trpc';
import { notificationRouter } from './notification';
import { websiteRouter } from './website';
import { monitorRouter } from './monitor';

export const appRouter = router({
  website: websiteRouter,
  notification: notificationRouter,
  monitor: monitorRouter,
});

export type AppRouter = typeof appRouter;
