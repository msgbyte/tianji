import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext, router } from './trpc';
import { notificationRouter } from './routers/notification';
import { websiteRouter } from './routers/website';
import { monitorRouter } from './routers/monitor';

const appRouter = router({
  website: websiteRouter,
  notification: notificationRouter,
  monitor: monitorRouter,
});

export type AppRouter = typeof appRouter;

export const trpcExpressMiddleware = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error('Error:', path, error);
  },
});
