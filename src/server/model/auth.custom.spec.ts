import { Auth, skipCSRFCheck } from '@auth/core';
import { afterEach, expect, test, vi } from 'vitest';
import { authConfig } from './auth.js';

const issuer = 'https://idp.example';

vi.mock('../utils/env.js', async (importOriginal) => {
  const { env } = await importOriginal<typeof import('../utils/env.js')>();
  return {
    env: {
      isProd: true,
      auth: {
        provider: ['custom'],
        secret: 'test-auth-secret',
        custom: {
          ...env.auth.custom,
          issuer: 'https://idp.example',
          clientId: 'test-client',
          clientSecret: 'test-secret',
        },
      },
    },
  };
});
vi.mock('./_client.js', () => ({ prisma: {} }));
vi.mock('./user.js', () => ({
  authUser: vi.fn(),
  createUserWithAuthjs: vi.fn(),
}));
vi.mock('../utils/logger.js', () => ({ logger: {} }));

afterEach(() => {
  vi.unstubAllGlobals();
});

test('sends state with the custom OIDC authorization request', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        jwks_uri: `${issuer}/jwks`,
      })
    )
  );

  const response = await Auth(
    new Request('https://tianji.example/api/auth/signin/custom', {
      method: 'POST',
    }),
    { ...authConfig, skipCSRFCheck }
  );

  const location = new URL(response.headers.get('location') ?? '');
  expect(location.origin + location.pathname).toBe(`${issuer}/authorize`);
  expect(location.searchParams.get('state')).toBeTruthy();
  expect(location.searchParams.get('code_challenge')).toBeTruthy();
});
