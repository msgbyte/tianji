import { Auth, raw } from '@auth/core';
import { expect, test, vi } from 'vitest';
import { authConfig } from './auth.js';

vi.mock('../utils/env.js', () => ({
  env: {
    isProd: true,
    auth: {
      provider: ['github'],
      secret: 'test-auth-secret',
      github: { clientId: 'test-client', clientSecret: 'test-secret' },
    },
  },
}));
vi.mock('./_client.js', () => ({ prisma: {} }));
vi.mock('./user.js', () => ({
  authUser: vi.fn(),
  createUserWithAuthjs: vi.fn(),
}));
vi.mock('../utils/logger.js', () => ({ logger: {} }));

test.each([
  ['https://github.com/login/oauth', { type: 'OAuthCallbackError' }],
  [undefined, { type: 'OAuthCallbackError' }],
  [
    'https://wrong.example',
    {
      type: 'CallbackRouteError',
      cause: {
        err: { message: 'unexpected "iss" (issuer) response parameter value' },
      },
    },
  ],
])('validates the GitHub callback issuer %s', async (issuer, expectedError) => {
  const url = new URL('https://tianji.example/api/auth/callback/github');
  // A denied authorization exercises issuer validation without a token exchange.
  url.searchParams.set('error', 'access_denied');
  if (issuer) {
    url.searchParams.set('iss', issuer);
  }

  await expect(
    Auth(new Request(url), {
      ...authConfig,
      raw,
      logger: { error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
    })
  ).rejects.toMatchObject(expectedError);
});
