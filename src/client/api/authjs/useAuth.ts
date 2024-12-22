import { useEvent } from '@/hooks/useEvent';
import { signIn, SignInResponse, signOut } from './lib';
import { useUserStore } from '@/store/user';
import { toast } from 'sonner';
import { trpc } from '../trpc';
import { useTranslation } from '@i18next-toolkit/react';
import { BuiltInProviderType } from '@auth/core/providers';

export function useAuth() {
  const trpcUtils = trpc.useUtils();
  const { t } = useTranslation();

  const loginWithPassword = useEvent(
    async (username: string, password: string) => {
      let res: SignInResponse | undefined;
      try {
        res = await signIn('account', {
          username,
          password,
          redirect: false,
        });
      } catch (err) {
        toast.error(t('Login failed'));
        throw err;
      }

      if (res?.error) {
        toast.error(t('Login failed, please check your username and password'));
        throw new Error('Login failed');
      }

      const userInfo = await trpcUtils.user.info.fetch();
      if (!userInfo) {
        toast.error(t('Can not get current user info'));
        throw new Error('Login failed, ');
      }

      return userInfo;
    }
  );

  const loginWithEmail = useEvent(async (email: string) => {
    let res: SignInResponse | undefined;
    try {
      res = await signIn('email', {
        email,
        redirect: false,
      });
    } catch (err) {
      toast.error(t('Login failed'));
      throw err;
    }

    if (res?.error) {
      toast.error(t('Login failed, please check your email'));
      throw new Error('Login failed');
    }

    return res?.url;
  });

  const loginWithOAuth = useEvent(
    async (provider: BuiltInProviderType | 'custom') => {
      let res: SignInResponse | undefined;
      try {
        res = await signIn(provider, {
          redirect: false,
        });
        console.log('loginWithOAuth', res);
      } catch (err) {
        toast.error(t('Login failed'));
        throw err;
      }

      if (res?.error) {
        toast.error(t('Login failed'));
        throw new Error('Login failed');
      }

      const userInfo = await trpcUtils.user.info.fetch();
      if (!userInfo) {
        toast.error(t('Can not get current user info'));
        throw new Error('Login failed, ');
      }

      return userInfo;
    }
  );

  const logout = useEvent(async () => {
    await signOut({
      redirect: false,
    });

    useUserStore.setState({ info: null });
    window.location.href = '/login'; // not good, need to invest to find better way.
  });

  return {
    loginWithPassword,
    loginWithEmail,
    loginWithOAuth,
    logout,
  };
}
