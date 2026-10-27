import express from 'express';
import { request as httpRequest } from 'node:http';
import { once } from 'node:events';
import { ExpressAuth } from '@auth/express';
import Credentials from '@auth/core/providers/credentials';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  eval: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  env: {
    auth: { rateLimitEnabled: true },
    cache: { redisUrl: 'redis://localhost:6379' as string | undefined },
  },
}));
vi.mock('ioredis', () => ({
  Redis: vi.fn(function () {
    return {
      eval: mocks.eval,
      connect: mocks.connect,
      disconnect: mocks.disconnect,
      on: vi.fn(),
    };
  }),
}));
vi.mock('../utils/env.js', () => ({ env: mocks.env }));
vi.mock('../utils/logger.js', () => ({ logger: { warn: vi.fn() } }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mocks.env.auth.rateLimitEnabled = true;
  mocks.env.cache.redisUrl = 'redis://localhost:6379';
  mocks.connect.mockResolvedValue(undefined);
  mocks.eval.mockResolvedValue([1, 900_000]);
});

const makeRequest = (ip: string, headers = {}) =>
  ({ socket: { remoteAddress: ip }, headers }) as express.Request;

describe('Redis authentication rate limits', () => {
  it('skips Redis entirely when rate limiting is disabled', async () => {
    mocks.env.auth.rateLimitEnabled = false;
    const { consumeAuthRateLimit } = await import('./authRateLimit.js');

    expect(await consumeAuthRateLimit(makeRequest('192.0.2.1'), 'login')).toBe(
      0
    );
    expect(mocks.connect).not.toHaveBeenCalled();
    expect(mocks.eval).not.toHaveBeenCalled();
  });

  it('allows the limit, then returns the remaining window without resetting it', async () => {
    const { consumeAuthRateLimit } = await import('./authRateLimit.js');
    mocks.eval.mockResolvedValueOnce([10, 42_001]);
    expect(await consumeAuthRateLimit(makeRequest('192.0.2.1'), 'login')).toBe(
      0
    );
    mocks.eval.mockResolvedValueOnce([11, 42_001]);
    expect(await consumeAuthRateLimit(makeRequest('192.0.2.1'), 'login')).toBe(
      43
    );
    expect(mocks.eval).toHaveBeenCalledWith(
      expect.stringContaining('INCR'),
      1,
      expect.stringMatching(/^tianji:auth-rate-limit:login:[a-f0-9]{64}$/),
      900_000
    );
  });

  it('separates IPs and policies and canonicalizes IPv6 addresses', async () => {
    const { consumeAuthRateLimit } = await import('./authRateLimit.js');
    await consumeAuthRateLimit(makeRequest('2001:db8::1'), 'login');
    await consumeAuthRateLimit(makeRequest('2001:0db8:0:0:0:0:0:1'), 'login');
    await consumeAuthRateLimit(makeRequest('2001:db8::2'), 'login');
    await consumeAuthRateLimit(makeRequest('2001:db8::1'), 'email');
    const keys = mocks.eval.mock.calls.map((call) => call[2]);
    expect(keys[0]).toBe(keys[1]);
    expect(new Set(keys).size).toBe(3);
  });

  it('ignores unsolicited proxy headers and accepts only the configured IP header', async () => {
    const { consumeAuthRateLimit } = await import('./authRateLimit.js');
    const direct = makeRequest('192.0.2.1');
    const forwarded = makeRequest('192.0.2.1', {
      'cf-connecting-ip': '192.0.2.2',
      'x-forwarded-for': '192.0.2.3',
    });
    await consumeAuthRateLimit(direct, 'login');
    await consumeAuthRateLimit(forwarded, 'login');
    expect(mocks.eval.mock.calls[0][2]).toBe(mocks.eval.mock.calls[1][2]);
    vi.stubEnv('CLIENT_IP_HEADER', 'CF-Connecting-IP');
    await consumeAuthRateLimit(forwarded, 'login');
    expect(mocks.eval.mock.calls[2][2]).not.toBe(mocks.eval.mock.calls[0][2]);
    await consumeAuthRateLimit(
      makeRequest('192.0.2.1', { 'cf-connecting-ip': 'invalid' }),
      'login'
    );
    expect(mocks.eval.mock.calls[3][2]).toBe(mocks.eval.mock.calls[0][2]);
  });

  it('keeps Redis optional and refuses protected requests when configured Redis fails', async () => {
    const { consumeAuthRateLimit } = await import('./authRateLimit.js');
    mocks.env.cache.redisUrl = undefined;
    expect(await consumeAuthRateLimit(makeRequest('192.0.2.1'), 'login')).toBe(
      0
    );
    expect(mocks.eval).not.toHaveBeenCalled();
    mocks.env.cache.redisUrl = 'redis://localhost:6379';
    mocks.eval.mockRejectedValueOnce(new Error('connection lost'));
    await expect(
      consumeAuthRateLimit(makeRequest('192.0.2.1'), 'login')
    ).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
  });

  it('retries initialization after a connection failure', async () => {
    const { consumeAuthRateLimit } = await import('./authRateLimit.js');
    mocks.connect.mockRejectedValueOnce(new Error('connection refused'));
    await expect(
      consumeAuthRateLimit(makeRequest('192.0.2.1'), 'login')
    ).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    expect(await consumeAuthRateLimit(makeRequest('192.0.2.1'), 'login')).toBe(
      0
    );
    expect(mocks.connect).toHaveBeenCalledTimes(2);
  });
});

describe('Auth.js middleware', () => {
  async function createApp() {
    const { authRateLimit } = await import('./authRateLimit.js');
    const app = express();
    app.use('/api/auth', authRateLimit);
    app.use((_req, res) => res.json({ executed: true }));
    return app;
  }

  it('limits raw paths that Auth.js normalizes before calling authorize', async () => {
    const { authRateLimit } = await import('./authRateLimit.js');
    const authorize = vi.fn().mockResolvedValue(null);
    const app = express();
    app.use('/api/auth', authRateLimit);
    app.use(
      '/api/auth/*',
      ExpressAuth({
        trustHost: true,
        secret: 'test-auth-secret',
        providers: [Credentials({ id: 'account', authorize })],
      })
    );
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing port');
    const rawRequest = (path: string, body?: string, cookie?: string) =>
      new Promise<{ status: number; body: string; cookies: string[] }>(
        (resolve, reject) => {
          const req = httpRequest(
            {
              host: '127.0.0.1',
              port: address.port,
              path,
              method: body ? 'POST' : 'GET',
              headers: {
                'content-type': 'application/x-www-form-urlencoded',
                cookie: cookie ?? '',
              },
            },
            (res) => {
              let response = '';
              res.on('data', (chunk) => {
                response += chunk;
              });
              res.on('end', () =>
                resolve({
                  status: res.statusCode!,
                  body: response,
                  cookies: res.headers['set-cookie'] ?? [],
                })
              );
            }
          );
          req.on('error', reject);
          req.end(body);
        }
      );
    try {
      const csrf = await rawRequest('/api/auth/csrf');
      const body = new URLSearchParams({
        csrfToken: JSON.parse(csrf.body).csrfToken,
      }).toString();
      const cookie = csrf.cookies
        .map((value) => value.split(';')[0])
        .join('; ');
      mocks.eval.mockResolvedValue([11, 1000]);
      for (const path of [
        '/api/auth/callback/account',
        '/api/auth/x/../callback/account',
        '/api/auth/x/%2e%2e/callback/account',
        '/api/auth/x\\..\\callback\\account',
      ]) {
        expect((await rawRequest(path, body, cookie)).status).toBe(429);
      }
      expect(authorize).not.toHaveBeenCalled();
      expect(mocks.eval).toHaveBeenCalledTimes(4);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it.each([
    ['/callback/account', 'login', 11],
    ['/signin/email', 'email', 6],
    ['//signin//email/', 'email', 6],
    ['/callback/email?token=secret', 'token', 31],
    ['/signin/github', 'token', 31],
  ])(
    'blocks %s before executing authentication or sending mail',
    async (path, policy, count) => {
      mocks.eval.mockResolvedValue([count, 12_001]);
      const app = await createApp();
      const res = await request(app).post(`/api/auth${path}`);
      expect(res.status).toBe(429);
      expect(res.headers['retry-after']).toBe('13');
      expect(new URL(res.body.url).searchParams.get('error')).toBe(
        'TooManyRequests'
      );
      expect(res.body.executed).toBeUndefined();
      expect(mocks.eval.mock.calls[0][2]).toContain(`:${policy}:`);
    }
  );

  it('limits email verification GET requests but leaves sessions, CSRF and sign-out alone', async () => {
    mocks.eval.mockResolvedValue([31, 1000]);
    const app = await createApp();
    expect(
      (await request(app).get('/api/auth/callback/email?token=secret')).status
    ).toBe(429);
    for (const path of [
      '/session',
      '/csrf',
      '/providers',
      '/signout',
      '/signin/email',
    ]) {
      expect((await request(app).get(`/api/auth${path}`)).status).toBe(200);
    }
    expect(mocks.eval).toHaveBeenCalledOnce();
  });

  it('returns 503 when Redis fails and allows normal requests', async () => {
    const app = await createApp();
    expect(
      (await request(app).post('/api/auth/callback/account')).body.executed
    ).toBe(true);
    mocks.eval.mockRejectedValueOnce(new Error('offline'));
    const res = await request(app).post('/api/auth/signin/email');
    expect(res.status).toBe(503);
    expect(new URL(res.body.url).searchParams.get('error')).toBe(
      'ServiceUnavailable'
    );
    expect(res.body.executed).toBeUndefined();
  });
});
