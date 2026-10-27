import express from 'express';
import request from 'supertest';
import Prometheus from 'prom-client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { prometheusApiVersion } from '../middleware/prometheus/index.js';
import { promTrpcRequest } from '../utils/prometheus/client.js';
import {
  trpcExpressMiddleware,
  trpcOpenapiHttpHandler,
  trpcMetricsRoute,
} from './index.js';

vi.mock('../middleware/auth.js', () => ({ jwtVerify: vi.fn() }));
vi.mock('../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../model/user.js', () => ({ verifyUserApiKey: vi.fn() }));
vi.mock('../model/workspace.js', () => ({ getWorkspaceUser: vi.fn() }));
vi.mock('../model/auditLog.js', () => ({
  createWorkspaceMutationAuditLog: vi.fn(),
}));
vi.mock('./routers/index.js', async () => {
  const { TRPCError } = await import('@trpc/server');
  const { z } = await import('zod');
  const { router, publicProcedure } = await import('./trpc.js');
  return {
    appRouter: router({
      website: router({
        info: publicProcedure
          .meta({
            openapi: {
              method: 'GET',
              path: '/workspace/{workspaceId}/website/{websiteId}',
            },
          })
          .input(z.object({ workspaceId: z.string(), websiteId: z.string() }))
          .output(z.string())
          .query(() => {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
          }),
      }),
      ping: publicProcedure.query(() => 'pong'),
      ready: publicProcedure.query(() => 'ready'),
    }),
  };
});

let app: express.Express;
beforeEach(() => {
  Prometheus.register.clear();
  promTrpcRequest.reset();
  Prometheus.register.registerMetric(promTrpcRequest);
  app = express();
  app.use(prometheusApiVersion({ resolveRoute: trpcMetricsRoute }));
  app.use('/trpc', trpcExpressMiddleware);
  app.use('/open', trpcOpenapiHttpHandler);
  app.get('/health', (_req, res) => res.send('OK'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  Prometheus.register.clear();
  vi.restoreAllMocks();
});

async function counts(name = 'http_request_duration_seconds') {
  const metric = await Prometheus.register.getSingleMetric(name)!.get();
  return metric.values
    .filter(
      (value) => 'metricName' in value && value.metricName === `${name}_count`
    )
    .map(({ labels, value }) => ({ ...labels, value }));
}

test.each(['website.info', 'website%2Einfo'])(
  'labels tRPC failures at %s with the procedure without query inputs',
  async (path) => {
    await request(app)
      .get(`/trpc/${path}`)
      .query({
        input: JSON.stringify({ workspaceId: 'secret', websiteId: 'id' }),
      })
      .expect(500);
    expect(await counts()).toEqual([
      { method: 'GET', route: '/trpc/website.info', code: 500, value: 1 },
    ]);
  }
);

test('aggregates OpenAPI failures across IDs into the route template', async () => {
  for (const id of ['first', 'second']) {
    await request(app)
      .get(`/open/workspace/${id}/website/private-id/?token=secret`)
      .expect(500);
  }
  expect(await counts()).toEqual([
    {
      method: 'GET',
      route: '/open/workspace/{workspaceId}/website/{websiteId}',
      code: 500,
      value: 2,
    },
  ]);
});

test.each([
  ['application/json', 207],
  ['application/jsonl', 200],
])(
  'groups %s batches with different procedure combinations under one HTTP route',
  async (accept, code) => {
    for (const path of [
      'ping,website.info,ping',
      'website.info,ping',
      'ready,website.info',
    ]) {
      await request(app)
        .get(`/trpc/${path}`)
        .set('trpc-accept', accept)
        .responseType('blob')
        .query({
          batch: '1',
          input: JSON.stringify({
            [path.split(',').indexOf('website.info')]: {
              workspaceId: 'secret',
              websiteId: 'id',
            },
          }),
        })
        .expect(code);
    }
    expect(await counts()).toEqual([
      { method: 'GET', route: '/trpc/batch', code, value: 3 },
    ]);
  }
);

test('groups single-procedure batches under the same HTTP route', async () => {
  await request(app).get('/trpc/ping?batch=1').expect(200);
  expect(await counts()).toEqual([
    { method: 'GET', route: '/trpc/batch', code: 200, value: 1 },
  ]);
});

test('normalizes case-insensitive API mount paths', async () => {
  await request(app).get('/TRPC/ping').expect(200);
  await request(app)
    .get('/OPEN/workspace/first/website/private-id')
    .expect(500);
  expect(await counts()).toEqual([
    { method: 'GET', route: '/trpc/ping', code: 200, value: 1 },
    {
      method: 'GET',
      route: '/open/workspace/{workspaceId}/website/{websiteId}',
      code: 500,
      value: 1,
    },
  ]);
});

test('does not put unregistered paths into metric labels', async () => {
  await request(app).get('/trpc/private-unknown').expect(404);
  await request(app).get('/open/private-unknown').expect(404);
  expect(await counts()).toEqual([
    { method: 'GET', route: '/trpc', code: 404, value: 1 },
    { method: 'GET', route: '/open', code: 404, value: 1 },
  ]);
});

test('handles invalid URL encoding without putting it into metric labels', async () => {
  await request(app).get('/trpc/%broken').expect(500);
  expect(await counts()).toEqual([
    { method: 'GET', route: '/trpc', code: 500, value: 1 },
  ]);
});

test('preserves ordinary Express routes', async () => {
  await request(app).get('/health').expect(200);
  expect(await counts()).toEqual([
    { method: 'GET', route: '/health', code: 200, value: 1 },
  ]);
});
