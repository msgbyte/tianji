import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext, router } from './trpc';
import { appRouter } from './routers';

export const trpcExpressMiddleware = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error('Error:', path, error);
  },
});
