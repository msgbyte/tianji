import request from 'supertest';
import express from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { app } from './app.js';
import { prisma } from './model/_client.js';

vi.mock('./model/_client.js', () => ({
  prisma: {
    aIGateway: { findUnique: vi.fn() },
    userApiKey: { findUnique: vi.fn(), update: vi.fn(async () => ({})) },
    workspacesOnUsers: { findFirst: vi.fn() },
  },
}));
vi.mock('./cache/index.js', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  buildQueryWithCache: (_name: string, get: unknown) => ({
    get,
    del: vi.fn(),
    update: vi.fn(),
  }),
}));

vi.mock('./trpc/index.js', () => ({
  trpcExpressMiddleware: (_req: any, _res: any, next: any) => next(),
  trpcOpenapiDocument: {},
  trpcOpenapiHttpHandler: vi.fn(),
}));
vi.mock('@auth/express', () => ({
  ExpressAuth: () => (_req: any, _res: any, next: any) => next(),
}));
vi.mock('./model/auth.js', () => ({ authConfig: {} }));
vi.mock('./model/page/manager.js', () => ({
  customDomainManager: { findPageDomain: vi.fn() },
}));

afterEach(() => vi.restoreAllMocks());
beforeEach(() => {
  vi.mocked(prisma.aIGateway.findUnique).mockResolvedValue({
    id: 'gateway',
    workspaceId: 'workspace',
    modelApiKey: 'upstream-secret',
  } as any);
  vi.mocked(prisma.userApiKey.findUnique).mockResolvedValue({
    user: { id: 'user' },
  } as any);
  vi.mocked(prisma.workspacesOnUsers.findFirst).mockResolvedValue(null);
});

test.each([
  ['post', 'custom/v1/chat/completions'],
  ['post', 'custom/v1/responses'],
  ['post', 'custom/v1/messages'],
  ['get', 'custom/v1/models'],
  ['get', 'anthropic/v1/models'],
])(
  'shared authorization preserves 401 and 403 on %s %s',
  async (method, path) => {
    const url = `/api/ai/workspace/gateway/${path}`;
    for (const status of [403, 401]) {
      if (status === 401)
        vi.mocked(prisma.userApiKey.findUnique).mockResolvedValue(null);
      const result = await request(app)
        [method as 'post'](url)
        .set('Authorization', 'Bearer caller-secret')
        .set('x-api-key', 'caller-secret')
        .send({
          model: 'model',
          messages: [{ role: 'user', content: 'Hola' }],
          input: 'Hola',
          max_tokens: 10,
        });
      expect(result.status).toBe(status);
      expect(result.text).not.toContain('caller-secret');
      expect(result.text).not.toContain('upstream-secret');
    }
  }
);

test.each(['GET', 'POST', 'PUT', 'OPTIONS'])(
  'unknown API %s returns JSON 404, not the SPA',
  async (method) => {
    const result = await request(app)
      [
        method.toLowerCase() as 'get'
      ]('/api/ai/workspace/gateway/custom/v1beta/files')
      .set('Accept', 'text/html')
      .timeout(1000);
    // CORS handles OPTIONS itself.
    expect(result.status).toBe(method === 'OPTIONS' ? 204 : 404);
    if (method !== 'OPTIONS') {
      expect(result.headers['content-type']).toContain('application/json');
      expect(result.body).toEqual({ message: 'API endpoint not found.' });
    }
  }
);
test.each([
  '/api/unknown-path',
  '/api/ai/workspace/gateway/openai/v1/unknown-path',
])('unknown non-Gemini API %s returns a generic JSON 404', async (path) => {
  const result = await request(app).get(path).set('Accept', 'text/html');
  expect(result.status).toBe(404);
  expect(result.headers['content-type']).toContain('application/json');
  expect(result.body).toEqual({ message: 'API endpoint not found.' });
});
test('unknown Gemini action preserves the native 404 envelope', async () => {
  const result = await request(app)
    .post('/api/ai/workspace/gateway/custom/v1beta/models/model:unknownAction')
    .send({});
  expect(result.status).toBe(404);
  expect(result.headers['content-type']).toContain('application/json');
  expect(result.body).toEqual({
    error: {
      code: 404,
      status: 'NOT_FOUND',
      message: 'Gemini endpoint not found.',
    },
  });
});
test.each(['post', 'put', 'delete'])(
  'unknown non-API %s also ends',
  async (method) => {
    expect(
      (await request(app)[method as 'post']('/unknown-path').timeout(1000))
        .status
    ).toBe(404);
  }
);
test('preserves the frontend HTML GET fallback', async () => {
  const sendFile = vi
    .spyOn(express.response, 'sendFile')
    .mockImplementation(function (this: express.Response) {
      this.type('html').send('<html>SPA</html>');
      return this;
    });
  const result = await request(app)
    .get('/ai-gateway/example')
    .set('Accept', 'text/html');
  expect(result.status).toBe(200);
  expect(sendFile).toHaveBeenCalledWith(
    expect.stringContaining('public/index.html')
  );
});
test.each(['{bad', '{"contents":'])(
  'malformed JSON has a Gemini 400 envelope',
  async (body) => {
    const result = await request(app)
      .post(
        '/api/ai/workspace/gateway/custom/v1beta/models/model:generateContent'
      )
      .type('json')
      .send(body);
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({
      error: { code: 400, status: 'INVALID_ARGUMENT' },
    });
  }
);
