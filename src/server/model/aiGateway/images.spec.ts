import 'express-async-errors';
import express from 'express';
import { once } from 'node:events';
import http, { type Server } from 'node:http';
import https from 'node:https';
import type { AddressInfo } from 'node:net';
import { createGunzip, gunzipSync, gzipSync } from 'node:zlib';
import request from 'supertest';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { app } from '../../app.js';
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

vi.mock('../../trpc/index.js', () => ({
  trpcExpressMiddleware: (_req: any, _res: any, next: any) => next(),
  trpcOpenapiDocument: {},
  trpcOpenapiHttpHandler: vi.fn(),
  trpcMetricsRoute: () => undefined,
}));
vi.mock('@auth/express', () => ({
  ExpressAuth: () => (_req: any, _res: any, next: any) => next(),
}));
vi.mock('../auth.js', () => ({ authConfig: {} }));
vi.mock('../page/manager.js', () => ({
  customDomainManager: { findPageDomain: vi.fn() },
}));

let server: Server;
let upstreamUrl: string;
let gateway: any;
let received: { url: string; body: Buffer; headers: any }[];
let reply: express.RequestHandler;

beforeEach(async () => {
  vi.resetAllMocks();
  received = [];
  vi.mocked(prisma.aIGatewayLogs.create).mockResolvedValue({
    id: 'log',
  } as any);
  vi.mocked(prisma.aIGatewayLogs.update).mockResolvedValue({} as any);
  reply = (_req, res) => {
    res.status(201).type('application/json').end('{ "result": "ok" }');
  };
  const upstream = express();
  upstream.use(express.raw({ type: '*/*', limit: '20mb' }));
  upstream.use((req, res, next) => {
    received.push({
      url: req.url,
      body: req.body,
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
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
  expect(prisma.aIGatewayLogs.create).not.toHaveBeenCalled();
  expect(prisma.aIGatewayLogs.update).not.toHaveBeenCalled();
  expect(checkQuotaAlert).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});

const path = '/api/ai/workspace/gateway/custom/v1/images/';

function post(
  action = 'generations',
  payload: string | object = { model: 'gpt-image-1', prompt: 'private prompt' }
) {
  return request(app)
    .post(path + action)
    .set('Authorization', 'Bearer caller-key')
    .send(payload);
}

test.each(['generations', 'edits', 'variations'])(
  'forwards %s JSON unchanged without gateway logs',
  async (action) => {
    const raw =
      '{ "model":"gpt-image-1", "prompt":"private prompt", "n":2, "size":"1024x1024", "quality":"high", "image":"private-image", "stream":false }';
    reply = (_req, res) =>
      res
        .status(201)
        .set('x-request-id', 'request-id')
        .json({
          data: [{ b64_json: 'private-output', url: 'https://private/image' }],
          usage: { input_tokens: 12 },
        });
    const result = await post(action + '?tag=a%2Fb&tag=c+d', raw)
      .set('Content-Type', 'application/json')
      .set('Origin', 'https://client.example');
    expect(result.status).toBe(201);
    expect(result.body.data[0].b64_json).toBe('private-output');
    expect(result.headers['x-request-id']).toBe('request-id');
    expect(result.headers['access-control-allow-origin']).toBe('*');
    expect(received).toHaveLength(1);
    expect(received[0].url).toBe(
      '/api/v1/images/' + action + '?tag=a%2Fb&tag=c+d'
    );
    expect(received[0].body.toString()).toBe(raw);
    expect(received[0].headers.authorization).toBe(
      'Bearer stored-upstream-key'
    );
  }
);

test('streams multipart binary bytes with the original boundary', async () => {
  const boundary = 'image-boundary';
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="private.png"\r\nContent-Type: image/png\r\n\r\n`
    ),
    Buffer.from([0, 255, 128, 13, 10, 12]),
    Buffer.from(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-1\r\n--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\nprivate prompt\r\n--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n1024x1024\r\n--${boundary}--\r\n`
    ),
  ]);
  const result = await post('edits', body).set(
    'Content-Type',
    `multipart/form-data; boundary=${boundary}`
  );
  expect(result.status).toBe(201);
  expect(received[0].body).toEqual(body);
  expect(received[0].headers['content-type']).toBe(
    `multipart/form-data; boundary=${boundary}`
  );
});

test.each([302, 422, 429, 500])(
  'preserves error status %s and body without retries',
  async (status) => {
    reply = (_req, res) =>
      res
        .status(status)
        .set('Retry-After', '7')
        .set('Location', '/private')
        .end('private error prompt and API key');
    const result = await post();
    expect(result.status).toBe(status);
    expect(result.text).toBe('private error prompt and API key');
    expect(result.headers['retry-after']).toBe('7');
    expect(received).toHaveLength(1);
  }
);

test('returns 502 on transport errors without leaking connection details', async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  const result = await post();
  expect(result.status).toBe(502);
  expect(result.body).toEqual({ message: 'Upstream request failed.' });
});

test('rejects unauthenticated and unauthorized requests before forwarding or logging', async () => {
  expect(
    (
      await request(app)
        .post(path + 'generations')
        .send({})
    ).status
  ).toBe(401);
  vi.mocked(prisma.workspacesOnUsers.findFirst).mockResolvedValue(null);
  expect((await post()).status).toBe(403);
  expect(received).toHaveLength(0);
  expect(prisma.aIGatewayLogs.create).not.toHaveBeenCalled();
});

test.each(['generations', 'edits', 'variations'])(
  'routes OpenAI %s to the official upstream',
  async (action) => {
    vi.spyOn(https, 'request').mockImplementation(
      (url: any, options: any, callback?: any) => {
        expect(String(url)).toBe(`https://api.openai.com/v1/images/${action}`);
        return http.request(
          `${upstreamUrl}/v1/images/${action}`,
          options,
          callback
        );
      }
    );
    gateway.modelApiKey = null;
    const result = await request(app)
      .post(path.replace('/custom/', '/openai/') + action)
      .set('Authorization', 'Bearer caller-key')
      .send({ model: 'gpt-image-1' });
    expect(result.status).toBe(201);
    expect(received[0].headers.authorization).toBe('Bearer caller-key');
    expect(prisma.userApiKey.findUnique).not.toHaveBeenCalled();
  }
);

test.each(['', '/v1', '/v1/'])(
  'normalizes custom base suffix %s without duplicating v1',
  async (suffix) => {
    gateway.customModelBaseUrl = upstreamUrl + suffix;
    expect((await post()).status).toBe(201);
    expect(received[0].url).toBe('/v1/images/generations');
  }
);

test('preserves compressed response bytes and headers', async () => {
  const compressed = gzipSync('private image result');
  reply = (_req, res) =>
    res
      .set('Content-Encoding', 'gzip')
      .set('Content-Length', String(compressed.length))
      .type('text/plain')
      .end(compressed);
  const result = await post();
  expect(result.text).toBe('private image result');
  expect(result.headers['content-encoding']).toBe('gzip');
  expect(result.headers['content-length']).toBe(String(compressed.length));
});

test.each([
  path + 'generations',
  '/api/ai/workspace/gateway/custom/api/alpha/decisions',
])('compresses chunked JSON efficiently on %s', async (url) => {
  const body = Buffer.from(
    JSON.stringify({
      data: Array.from({ length: 256 }, () => ({
        b64_json: 'sample-image-output'.repeat(32),
      })),
    })
  );
  reply = async (_req, res) => {
    res.type('application/json');
    for (let offset = 0; offset < body.length; offset += 1024) {
      res.write(body.subarray(offset, offset + 1024));
      await new Promise((resolve) => setImmediate(resolve));
    }
    res.end();
  };
  const listener = app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  try {
    const client = http.request({
      hostname: '127.0.0.1',
      port: (listener.address() as AddressInfo).port,
      path: url,
      method: 'POST',
      headers: {
        authorization: 'Bearer caller-key',
        'content-type': 'application/json',
        'accept-encoding': 'gzip',
      },
    });
    client.end('{}');
    const [response] = await once(client, 'response');
    const chunks: Buffer[] = [];
    for await (const chunk of response) chunks.push(chunk);
    const compressed = Buffer.concat(chunks);
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBe('gzip');
    expect(gunzipSync(compressed)).toEqual(body);
    expect(compressed.length).toBeLessThan(gzipSync(body).length * 2);
  } finally {
    listener.closeAllConnections();
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }
});

test('forwards multipart with an invalid boundary without blocking', async () => {
  expect(
    (
      await post('edits', Buffer.from('private binary')).set(
        'Content-Type',
        'multipart/form-data'
      )
    ).status
  ).toBe(201);
  expect(received[0].body.toString()).toBe('private binary');
});

test('forwards JSON larger than the standard parser limit without buffering or parsing', async () => {
  const body = JSON.stringify({
    model: 'gpt-image-1',
    images: [
      {
        image_url:
          'data:image/png;base64,' +
          Buffer.alloc(8 * 1024 * 1024).toString('base64'),
      },
    ],
  });
  const result = await post('edits', body).type('json');
  expect(result.status).toBe(201);
  expect(received[0].body.toString()).toBe(body);
});

test('leaves malformed JSON validation to the image provider', async () => {
  const result = await post('edits', '{invalid JSON').type('json');
  expect(result.status).toBe(201);
  expect(received[0].body.toString()).toBe('{invalid JSON');
});

test('preserves compressed request bytes and content encoding', async () => {
  // Read raw bytes at the mock provider before its decompression middleware.
  server.removeAllListeners('request');
  const compressed = gzipSync('{ "model": "gpt-image-1" }');
  const chunks: Buffer[] = [];
  server.on('request', (req, res) => {
    expect(req.headers['content-encoding']).toBe('gzip');
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => res.end('ok'));
  });
  const listener = app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  try {
    const client = http.request({
      hostname: '127.0.0.1',
      port: (listener.address() as AddressInfo).port,
      path: path + 'edits',
      method: 'POST',
      headers: {
        authorization: 'Bearer caller-key',
        'content-type': 'application/json',
        'content-encoding': 'gzip',
      },
    });
    client.end(compressed);
    const [response] = await once(client, 'response');
    response.resume();
    await once(response, 'end');
    expect(response.statusCode).toBe(200);
    expect(Buffer.concat(chunks)).toEqual(compressed);
  } finally {
    listener.closeAllConnections();
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }
});

test('does not dispatch if the client disconnects during authentication', async () => {
  let resolveGateway!: (value: any) => void;
  vi.mocked(prisma.aIGateway.findUnique).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveGateway = resolve;
      }) as any
  );
  const listener = app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const closed = new Promise<void>((resolve) => {
    listener.once('request', (_req, res) => res.once('close', resolve));
  });
  try {
    const client = http.request({
      hostname: '127.0.0.1',
      port: (listener.address() as AddressInfo).port,
      path: path + 'generations',
      method: 'POST',
      headers: {
        authorization: 'Bearer caller-key',
        'content-type': 'application/json',
      },
    });
    client.on('error', () => {});
    client.end('{}');
    await vi.waitFor(() =>
      expect(prisma.aIGateway.findUnique).toHaveBeenCalled()
    );
    client.destroy();
    await closed;
    resolveGateway(gateway);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    expect(prisma.aIGatewayLogs.create).not.toHaveBeenCalled();
    expect(received).toHaveLength(0);
  } finally {
    listener.closeAllConnections();
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }
});

test('rejects an unsupported upstream protocol before forwarding', async () => {
  gateway.customModelBaseUrl = 'ftp://invalid.example';
  expect((await post()).status).toBe(400);
  expect(prisma.aIGatewayLogs.create).not.toHaveBeenCalled();
  expect(received).toHaveLength(0);
});

test('streams response chunks before completion and closes upstream on client disconnect', async () => {
  let upstreamResponse: express.Response | undefined;
  reply = (_req, res) => {
    upstreamResponse = res;
    res
      .set('Cache-Control', 'no-cache')
      .set('Content-Type', 'Text/Event-Stream; charset=utf-8')
      .write('data: private partial image\n\n');
  };
  const listener = app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  try {
    const client = http.request({
      hostname: '127.0.0.1',
      port: (listener.address() as AddressInfo).port,
      path: path + 'generations',
      method: 'POST',
      headers: {
        authorization: 'Bearer caller-key',
        'content-type': 'application/json',
        'accept-encoding': 'gzip',
      },
    });
    client.end(JSON.stringify({ model: 'gpt-image-1', stream: true }));
    const [response] = await once(client, 'response');
    expect(response.headers['content-encoding']).toBe('gzip');
    const decoded = response.pipe(createGunzip());
    let output = '';
    decoded.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    await vi.waitFor(() =>
      expect(output).toBe('data: private partial image\n\n')
    );
    expect(prisma.aIGatewayLogs.update).not.toHaveBeenCalled();
    response.destroy();
    decoded.destroy();
    await vi.waitFor(() => expect(upstreamResponse?.destroyed).toBe(true));
  } finally {
    listener.closeAllConnections();
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }
});

test('closes the client connection when an upstream response is truncated', async () => {
  reply = (_req, res) => {
    res.set('Content-Length', '10000').write('partial image');
    setImmediate(() => res.destroy());
  };
  await expect(post()).rejects.toThrow();
});

test.each([
  '/api/ai/workspace/gateway/custom/v1/chat/completions',
  '/api/ai/workspace/gateway/custom/v1/responses',
  '/api/ai/workspace/gateway/custom/api/alpha/decisions',
  '/api/ai/workspace/gateway/custom/v1/images/unsupported',
])('keeps JSON validation and size limits on %s', async (url) => {
  expect(
    (await request(app).post(url).type('json').send('{invalid')).status
  ).toBe(400);
  expect(
    (
      await request(app)
        .post(url)
        .type('json')
        .send(JSON.stringify({ data: 'x'.repeat(10 * 1024 * 1024) }))
    ).status
  ).toBe(413);
  expect(received).toHaveLength(0);
});
