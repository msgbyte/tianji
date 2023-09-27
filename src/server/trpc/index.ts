import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext, publicProcedure, router } from './trpc';
import { z } from 'zod';
import { notificationRouter } from './routers/notification';

const appRouter = router({
  debug: publicProcedure.input(z.string()).query((opts) => {
    return { id: opts.input, name: 'Bilbo' };
  }),
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;

export const trpcExpressMiddleware = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error('Error:', path, error);
  },
});
