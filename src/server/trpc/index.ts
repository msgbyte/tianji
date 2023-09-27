import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext, publicProcedure, router } from './trpc';
import { z } from 'zod';

const appRouter = router({
  debug: publicProcedure.input(z.string()).query((opts) => {
    return { id: opts.input, name: 'Bilbo' };
  }),
});

export type AppRouter = typeof appRouter;

export const trpcExpressMiddleware = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
});
