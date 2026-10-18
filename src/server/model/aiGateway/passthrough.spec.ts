import 'express-async-errors';
import express from 'express';
import { once } from 'node:events';
import http, { type Server } from 'node:http';
import https from 'node:https';
import type { AddressInfo } from 'node:net';
import { gzipSync } from 'node:zlib';
import request from 'supertest';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { aiGatewayRouter } from '../../router/aiGateway.js';
import { prisma } from '../_client.js';
import { checkQuotaAlert } from './quotaAlert.js';

vi.mock('../_client.js', () => ({
  prisma: {
    aIGateway: { findUnique: vi.fn() },
    aIGatewayLogs: { create: vi.fn(), update: vi.fn() },
    userApiKey: { findUnique: vi.fn(), update: vi.fn() },
    workspacesOnUsers: { findFirst: vi.fn() },
  },
}));
vi.mock('./quotaAlert.js', () => ({ checkQuotaAlert: vi.fn() }));
vi.mock('../../cache/index.js', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  buildQueryWithCache: (_name: string, get: unknown) => ({ get, del: vi.fn() }),
}));

const app = express();
app.use(
  express.json({
    verify(req, _res, buffer) {
      (req as express.Request).rawBody = buffer;
    },
  })
);
app.use('/api/ai', aiGatewayRouter);
app.use(((err, _req, res, _next) => {
  res.status(err.status || 500).json({ message: err.message });
}) as express.ErrorRequestHandler);

const path = '/api/ai/workspace/gateway/custom/api/alpha/decisions';
const payload = '{ "model": "original-model", "state": {}, "extra": [1, 2] }';
let server: Server;
let upstreamUrl: string;
let gateway: any;
let received: { url: string; body: string; headers: any }[];
let reply: express.RequestHandler;

beforeEach(async () => {
  vi.resetAllMocks();
  received = [];
  reply = (_req, res) => {
    res.status(201).type('application/json').end('{ "result": "ok" }');
  };
  const upstream = express();
  upstream.use(express.raw({ type: '*/*' }));
  upstream.use((req, res, next) => {
    received.push({
      url: req.url,
      body: req.body.toString(),
      headers: req.headers,
    });
    reply(req, res, next);
  });
  server = upstream.listen(0, '127.0.0.1');
  await once(server, 'listening');
  upstreamUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  gateway = {
    id: 'gateway',
    workspaceId: 'workspace',
    customModelBaseUrl: `${upstreamUrl}/api/v1`,
    customModelName: 'overridden-model',
    modelApiKey: 'stored-upstream-key',
  };
  vi.mocked(prisma.aIGateway.findUnique).mockResolvedValue(gateway);
  vi.mocked(prisma.userApiKey.findUnique).mockResolvedValue({
    user: { id: 'user' },
  } as any);
  vi.mocked(prisma.userApiKey.update).mockResolvedValue({} as any);
  vi.mocked(prisma.workspacesOnUsers.findFirst).mockResolvedValue({
    userId: 'user',
  } as any);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
  expect(prisma.aIGatewayLogs.create).not.toHaveBeenCalled();
  expect(prisma.aIGatewayLogs.update).not.toHaveBeenCalled();
  expect(checkQuotaAlert).not.toHaveBeenCalled();
});

function post(url = path) {
  return request(app)
    .post(url)
    .set('Authorization', 'Bearer caller-key')
    .set('Content-Type', 'application/json')
    .send(payload);
}

test.each([
  ['', '/api/alpha/decisions'],
  ['/', '/api/alpha/decisions'],
  ['/v1', '/api/alpha/decisions'],
  ['/api/v1', '/api/alpha/decisions'],
  ['/api/v1/', '/api/alpha/decisions'],
  ['/api', '/api/alpha/decisions'],
  ['/relay', '/relay/api/alpha/decisions'],
  ['/relay/api/v1', '/relay/api/alpha/decisions'],
])(
  'forwards the unchanged body and query through custom base %s',
  async (basePath, expectedPath) => {
    gateway.customModelBaseUrl = upstreamUrl + basePath;
    const result = await post(`${path}?tag=a%2Fb&tag=c+d`)
      .set('x-session-id', 'session')
      .set('Cookie', 'private=session')
      .set('x-api-key', 'private-key');

    expect(result.status).toBe(201);
    expect(result.text).toBe('{ "result": "ok" }');
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      url: `${expectedPath}?tag=a%2Fb&tag=c+d`,
      body: payload,
      headers: {
        authorization: 'Bearer stored-upstream-key',
        'content-type': 'application/json',
        'x-session-id': 'session',
      },
    });
    expect(received[0].headers.cookie).toBeUndefined();
    expect(received[0].headers['x-api-key']).toBeUndefined();
  }
);

test.each([302, 422, 429, 500])(
  'preserves upstream status %s, headers and non-JSON body without retries or redirects',
  async (status) => {
    reply = (_req, res) => {
      res
        .status(status)
        .set('Retry-After', '7')
        .set('Location', `${upstreamUrl}/must-not-follow`)
        .type('text/plain')
        .end('upstream response');
    };
    const result = await post();
    expect(result.status).toBe(status);
    expect(result.headers['retry-after']).toBe('7');
    expect(result.headers.location).toBe(`${upstreamUrl}/must-not-follow`);
    expect(result.text).toBe('upstream response');
    expect(received).toHaveLength(1);
  }
);

test('uses the caller key when the gateway has no stored key', async () => {
  gateway.modelApiKey = null;
  expect((await post()).status).toBe(201);
  expect(received[0].headers.authorization).toBe('Bearer caller-key');
  expect(prisma.userApiKey.findUnique).not.toHaveBeenCalled();
});

test('forwards OpenRouter decisions to the alpha API with provider headers', async () => {
  vi.spyOn(https, 'request').mockImplementation(
    (url: any, options: any, callback?: any) => {
      expect(String(url)).toBe(
        'https://openrouter.ai/api/alpha/decisions?trace=1'
      );
      return http.request(
        `${upstreamUrl}/api/alpha/decisions?trace=1`,
        options,
        callback
      );
    }
  );
  const result = await post(
    path.replace('/custom/', '/openrouter/') + '?trace=1'
  )
    .set('HTTP-Referer', 'https://client.example/')
    .set('X-Title', 'Client');
  expect(result.status).toBe(201);
  expect(received[0]).toMatchObject({
    url: '/api/alpha/decisions?trace=1',
    body: payload,
    headers: {
      authorization: 'Bearer stored-upstream-key',
      'http-referer': 'https://client.example/',
      'x-title': 'Client',
    },
  });
});

test('preserves compressed responses without corrupting the encoding or length', async () => {
  const compressed = gzipSync('compressed upstream response');
  reply = (_req, res) => {
    res
      .set('Content-Encoding', 'gzip')
      .set('Content-Length', String(compressed.length))
      .type('text/plain')
      .end(compressed);
  };
  const result = await post();
  expect(result.status).toBe(200);
  expect(result.text).toBe('compressed upstream response');
  expect(result.headers['content-encoding']).toBe('gzip');
  expect(result.headers['content-length']).toBe(String(compressed.length));
});

test('returns 502 when the upstream connection fails', async () => {
  reply = (req) => req.socket.destroy();
  const result = await post();
  expect(result.status).toBe(502);
  expect(result.body).toEqual({ message: 'Upstream request failed.' });
  expect(received).toHaveLength(1);
});

test('rejects a missing key before forwarding', async () => {
  expect((await request(app).post(path).send({})).status).toBe(401);
  expect(received).toHaveLength(0);
});

test('rejects callers outside the workspace before forwarding', async () => {
  vi.mocked(prisma.workspacesOnUsers.findFirst).mockResolvedValue(null);
  expect((await post()).status).toBe(403);
  expect(received).toHaveLength(0);
});

test('rejects an unknown gateway before forwarding', async () => {
  vi.mocked(prisma.aIGateway.findUnique).mockResolvedValue(null);
  expect((await post()).status).toBe(404);
  expect(received).toHaveLength(0);
});

test('requires an upstream URL for custom gateways', async () => {
  gateway.customModelBaseUrl = null;
  expect((await post()).status).toBe(400);
  expect(received).toHaveLength(0);
});

test('does not forward paths outside the whitelist', async () => {
  expect((await post(path.replace('decisions', 'unknown'))).status).toBe(404);
  expect(received).toHaveLength(0);
});
