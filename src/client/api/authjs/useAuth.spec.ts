import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from './useAuth';

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  toastError: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock('./lib', () => ({ signIn: mocks.signIn, signOut: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));
vi.mock('@/store/user', () => ({ useUserStore: {} }));
vi.mock('../trpc', () => ({
  trpc: { useUtils: () => ({ user: { info: { fetch: mocks.getUser } } }) },
}));
vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (message: string) => message }),
}));

beforeEach(() => vi.clearAllMocks());

describe.each(['password', 'email'] as const)(
  '%s authentication errors',
  (method) => {
    it.each([
      [429, 'TooManyRequests', 'Too many attempts. Please try again later.'],
      [
        503,
        'ServiceUnavailable',
        'Authentication is temporarily unavailable. Please try again later.',
      ],
    ])(
      'shows an accurate message for HTTP %s',
      async (status, error, message) => {
        mocks.signIn.mockResolvedValue({ status, error, ok: false, url: null });
        const { result } = renderHook(() => useAuth());
        const login =
          method === 'password'
            ? result.current.loginWithPassword('user', 'password')
            : result.current.loginWithEmail('user@example.com');

        await expect(login).rejects.toThrow('Login failed');
        expect(mocks.toastError).toHaveBeenCalledWith(message);
        expect(mocks.getUser).not.toHaveBeenCalled();
      }
    );

    it('preserves the existing message for invalid credentials', async () => {
      mocks.signIn.mockResolvedValue({
        status: 401,
        error: 'CredentialsSignin',
        ok: false,
        url: null,
      });
      const { result } = renderHook(() => useAuth());
      const login =
        method === 'password'
          ? result.current.loginWithPassword('user', 'password')
          : result.current.loginWithEmail('user@example.com');

      await expect(login).rejects.toThrow('Login failed');
      expect(mocks.toastError).toHaveBeenCalledWith(
        method === 'password'
          ? 'Login failed, please check your username and password'
          : 'Login failed, please check your email'
      );
    });
  }
);
