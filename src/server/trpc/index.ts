import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc';
import { appRouter } from './routers';
import {
  createOpenApiHttpHandler,
  generateOpenApiDocument,
} from 'trpc-openapi';

export const trpcExpressMiddleware = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error('Error:', path, error);
  },
});

export const trpcOpenapiHttpHandler = createOpenApiHttpHandler({
  router: appRouter,
  createContext,
});

export const trpcOpenapiDocument = generateOpenApiDocument(appRouter, {
  title: 'Tianji OpenAPI',
  description: 'Insight into everything',
  version: '1.0.0',
  baseUrl: '/open',
});
