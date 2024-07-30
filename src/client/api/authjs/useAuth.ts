import { useEvent } from '@/hooks/useEvent';
import { signIn } from './lib';

export function useAuth() {
  const loginWithPassword = useEvent(
    async (username: string, password: string) => {
      const res = await signIn('account', {
        username,
        password,
        redirect: false,
      });

      return res;
    }
  );

  return {
    loginWithPassword,
  };
}
