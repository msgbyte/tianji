import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc.js';
import { appRouter } from './routers/index.js';
import {
  createOpenApiHttpHandler,
  generateOpenApiDocument,
} from 'trpc-openapi';
const packageJson = await import('../../../package.json', {
  assert: { type: 'json' },
});

export type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

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
} as any);

const description = `
  <h3>Insight into everything</h3>
  <p>Github: <a href="https://github.com/msgbyte/tianji" target="_blank">https://github.com/msgbyte/tianji</a></p>
`.trim();
export const trpcOpenapiDocument = generateOpenApiDocument(appRouter, {
  title: 'Tianji OpenAPI',
  description,
  version: `v${packageJson.default.version}`,
  baseUrl: 'http://localhost:12345/open',
});
