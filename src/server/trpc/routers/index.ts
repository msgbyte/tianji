import { router } from '../trpc';
import { notificationRouter } from './notification';
import { websiteRouter } from './website';
import { monitorRouter } from './monitor';
import { userRouter } from './user';

export const appRouter = router({
  user: userRouter,
  website: websiteRouter,
  notification: notificationRouter,
  monitor: monitorRouter,
});

export type AppRouter = typeof appRouter;
