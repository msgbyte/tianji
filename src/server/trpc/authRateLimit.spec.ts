import express from 'express';
import { once } from 'node:events';
import type { Server } from 'node:http';
import request from 'supertest';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createOpenApiExpressMiddleware } from 'trpc-to-openapi';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  counts: new Map<string, number>(),
  eval: vi.fn(),
  execute: vi.fn(),
}));
vi.mock('ioredis', () => ({
  Redis: vi.fn(function () {
    return { connect: async () => {}, on: vi.fn(), eval: mocks.eval };
  }),
}));
vi.mock('../utils/env.js', () => ({
  env: {
    auth: { rateLimitEnabled: true },
    cache: { redisUrl: 'redis://localhost:6379' },
  },
}));
vi.mock('../utils/logger.js', () => ({ logger: { warn: vi.fn() } }));
vi.mock('../middleware/auth.js', () => ({
  jwtVerify: () => ({ id: 'actor-id', username: 'actor', role: 'user' }),
}));
vi.mock('../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../model/user.js', () => ({ verifyUserApiKey: vi.fn() }));
vi.mock('../model/workspace.js', () => ({
  getWorkspaceUser: async () => ({ role: 'admin' }),
}));
vi.mock('../model/auditLog.js', () => ({
  createWorkspaceMutationAuditLog: vi.fn(),
}));
vi.mock('../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: () => vi.fn() },
}));

const {
  router,
  publicProcedure,
  protectProedure,
  workspaceAdminProcedure,
  createContext,
} = await import('./trpc.js');
const { authRateLimit } = await import('../middleware/authRateLimit.js');
const mutation = publicProcedure.input(z.object({})).output(z.string());
const testRouter = router({
  user: router({
    login: mutation
      .meta({ openapi: { method: 'POST', path: '/login' } })
      .mutation(() => mocks.execute()),
    register: mutation.mutation(() => mocks.execute()),
    loginWithToken: mutation.mutation(() => mocks.execute()),
    changePassword: protectProedure
      .input(z.object({}))
      .mutation(() => mocks.execute()),
  }),
  workspace: router({
    invite: workspaceAdminProcedure
      .input(z.object({}))
      .mutation(() => mocks.execute()),
    acceptInvitation: protectProedure
      .input(z.object({}))
      .mutation(() => mocks.execute()),
    getInvitationInfo: publicProcedure.query(() => mocks.execute()),
  }),
  ping: publicProcedure.query(() => 'pong'),
});
const app = express();
app.use(express.json());
app.use('/api/auth', authRateLimit, (_req, res) => res.json({ ok: true }));
app.use(
  '/trpc',
  createExpressMiddleware({ router: testRouter, createContext })
);
app.use(
  '/open',
  createOpenApiExpressMiddleware({ router: testRouter, createContext })
);

let server: Server;
beforeAll(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.counts.clear();
  mocks.execute.mockReturnValue('ok');
  mocks.eval.mockImplementation(async (_script, _numKeys, key, windowMs) => {
    const count = (mocks.counts.get(key) ?? 0) + 1;
    mocks.counts.set(key, count);
    return [count, windowMs];
  });
});

test('shares a password login quota across tRPC, OpenAPI and Auth.js', async () => {
  for (let i = 0; i < 8; i++) {
    await request(server).post('/trpc/user.login').send({}).expect(200);
  }
  await request(server).post('/open/login').send({}).expect(200);
  await request(server).post('/api/auth/callback/account').expect(200);
  const blocked = await request(server).post('/trpc/user.login').send({});
  expect(blocked.status, JSON.stringify([...mocks.counts])).toBe(429);
  await request(server).post('/open/login').send({}).expect(429);
  await request(server).post('/api/auth/callback/account').expect(429);
  expect(mocks.execute).toHaveBeenCalledTimes(9);
  expect(mocks.counts.size).toBe(1);
});

test('counts every operation in a batch and stops excess operations', async () => {
  const paths = Array.from({ length: 11 }, () => 'user.login');
  const input = Object.fromEntries(paths.map((_, i) => [i, {}]));
  const res = await request(server)
    .post(`/trpc/${paths.join(',')}?batch=1`)
    .send(input);
  expect(res.status).toBe(207);
  expect(
    res.body.filter(
      (item: any) => item.error?.data.code === 'TOO_MANY_REQUESTS'
    )
  ).toHaveLength(1);
  expect(mocks.execute).toHaveBeenCalledTimes(10);
});

test('counts failed password attempts before credential validation', async () => {
  mocks.execute.mockImplementation(() => {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  });
  for (let i = 0; i < 10; i++) {
    const res = await request(server).post('/trpc/user.login').send({});
    expect(
      res.status,
      JSON.stringify({ body: res.body, counts: [...mocks.counts] })
    ).toBe(401);
  }
  const blocked = await request(server).post('/trpc/user.login').send({});
  expect(blocked.status, JSON.stringify([...mocks.counts])).toBe(429);
  expect(mocks.execute).toHaveBeenCalledTimes(10);
});

test.each([
  ['user.register', 'register'],
  ['user.loginWithToken', 'token'],
  ['user.changePassword', 'password'],
  ['workspace.invite', 'email'],
  ['workspace.acceptInvitation', 'token'],
  ['workspace.getInvitationInfo', 'token'],
])(
  'guards %s before authentication, database writes or email delivery',
  async (path, policy) => {
    mocks.eval.mockResolvedValue([100, 60_000]);
    const req =
      path === 'workspace.getInvitationInfo'
        ? request(server).get(`/trpc/${path}`)
        : request(server).post(`/trpc/${path}`).send({});
    await req.expect(429);
    expect(mocks.eval.mock.calls[0][2]).toContain(`:${policy}:`);
    expect(mocks.execute).not.toHaveBeenCalled();
  }
);

test('shares mail quotas and keeps authenticated invitations working within the limit', async () => {
  for (let i = 0; i < 4; i++) {
    await request(server).post('/api/auth/signin/email').expect(200);
  }
  await request(server)
    .post('/trpc/workspace.invite')
    .set('Authorization', 'Bearer test-token')
    .send({ workspaceId: 'abcdefghijklmnopqrstuvwx' })
    .expect(200);
  const blocked = await request(server).post('/api/auth/signin/email');
  expect(blocked.status, JSON.stringify([...mocks.counts])).toBe(429);
  await request(server).post('/trpc/workspace.invite').send({}).expect(429);
  expect(mocks.execute).toHaveBeenCalledOnce();
});

test('fails closed for Redis errors and leaves unrelated procedures available', async () => {
  mocks.eval.mockRejectedValue(new Error('offline'));
  await request(server).post('/trpc/user.login').send({}).expect(503);
  await request(server).post('/open/login').send({}).expect(503);
  await request(server).get('/trpc/ping').expect(200);
  expect(mocks.execute).not.toHaveBeenCalled();
  expect(mocks.eval).toHaveBeenCalledTimes(2);
});
