/**
 * This file is fork from next-auth/react
 */

import type {
  ClientSafeProvider,
  LiteralUnion,
  SignInAuthorizationParams,
  SignInOptions,
  SignInResponse,
  SignOutParams,
  SignOutResponse,
} from './types';
import type {
  BuiltInProviderType,
  RedirectableProviderType,
} from '@auth/core/providers';
import { Session } from '@auth/core/types';
import axios from 'axios';

export * from './types';

type UpdateSession = (data?: any) => Promise<Session | null>;

export type SessionContextValue<R extends boolean = false> = R extends true
  ?
      | { update: UpdateSession; data: Session; status: 'authenticated' }
      | { update: UpdateSession; data: null; status: 'loading' }
  :
      | { update: UpdateSession; data: Session; status: 'authenticated' }
      | {
          update: UpdateSession;
          data: null;
          status: 'unauthenticated' | 'loading';
        };

/**
 * Returns the current Cross Site Request Forgery Token (CSRF Token)
 * required to make POST requests (e.g. for signing in and signing out).
 * You likely only need to use this if you are not using the built-in
 * `signIn()` and `signOut()` methods.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#getcsrftoken)
 */
export async function getCsrfToken() {
  const { data } = await axios.get<{ csrfToken: string }>('/api/auth/csrf');

  return data.csrfToken;
}

/**
 * It calls `/api/auth/providers` and returns
 * a list of the currently configured authentication providers.
 * It can be useful if you are creating a dynamic custom sign in page.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#getproviders)
 */
export async function getProviders() {
  const { data } = await axios.get<
    Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider>
  >('/api/auth/providers');

  return data;
}

/**
 * Client-side method to initiate a signin flow
 * or send the user to the signin page listing all possible providers.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#signin)
 */
export async function signIn<
  P extends RedirectableProviderType | undefined = undefined,
>(
  provider?: LiteralUnion<
    P extends RedirectableProviderType
      ? P | BuiltInProviderType
      : BuiltInProviderType
  >,
  options?: SignInOptions,
  authorizationParams?: SignInAuthorizationParams
): Promise<
  P extends RedirectableProviderType ? SignInResponse | undefined : undefined
> {
  const { callbackUrl = window.location.href, redirect = true } = options ?? {};

  const baseUrl = '/api/auth';
  const providers = await getProviders();

  if (!providers) {
    window.location.href = `${baseUrl}/error`;
    return;
  }

  if (!provider || !(provider in providers)) {
    window.location.href = `${baseUrl}/signin?${new URLSearchParams({
      callbackUrl,
    })}`;
    return;
  }

  const isCredentials = providers[provider].type === 'credentials';
  const isEmail = providers[provider].type === 'email';
  const isSupportingReturn = isCredentials || isEmail;

  const signInUrl = `${baseUrl}/${
    isCredentials ? 'callback' : 'signin'
  }/${provider}`;

  const _signInUrl = `${signInUrl}${authorizationParams ? `?${new URLSearchParams(authorizationParams)}` : ''}`;

  const res = await fetch(_signInUrl, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Return-Redirect': '1',
    },
    // @ts-expect-error
    body: new URLSearchParams({
      ...options,
      csrfToken: await getCsrfToken(),
      callbackUrl,
      json: true,
    }),
  });

  const data = await res.json();

  // TODO: Do not redirect for Credentials and Email providers by default in next major
  if (redirect || !isSupportingReturn) {
    const url = data.url ?? callbackUrl;
    window.location.href = url;
    // If url contains a hash, the browser does not reload the page. We reload manually
    if (url.includes('#')) window.location.reload();
    return;
  }

  const error = new URL(data.url).searchParams.get('error');

  return {
    error,
    status: res.status,
    ok: res.ok,
    url: error ? null : data.url,
  } as any;
}

/**
 * Signs the user out, by removing the session cookie.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#signout)
 */
export async function signOut<R extends boolean = true>(
  options?: SignOutParams<R>
): Promise<R extends true ? undefined : SignOutResponse> {
  const { callbackUrl = window.location.href } = options ?? {};
  const baseUrl = '/api/auth';
  const fetchOptions = {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Auth-Return-Redirect': '1',
    },
    // @ts-expect-error
    body: new URLSearchParams({
      csrfToken: await getCsrfToken(),
      callbackUrl,
      json: true,
    }),
  };
  const res = await fetch(`${baseUrl}/signout`, fetchOptions);
  const data = await res.json();

  if (options?.redirect ?? true) {
    const url = data.url ?? callbackUrl;
    window.location.href = url;
    // If url contains a hash, the browser does not reload the page. We reload manually
    if (url.includes('#')) window.location.reload();
    // @ts-expect-error
    return;
  }

  return data;
}
