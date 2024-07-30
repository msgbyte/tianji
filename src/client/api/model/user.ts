import dayjs from 'dayjs';
import { useUserStore } from '../../store/user';
import { useEvent } from '../../hooks/useEvent';
import { clearJWT } from '../authjs';

/**
 * Mock
 * return local, or fetch remote data
 */
export function getUserTimezone(): string {
  return dayjs.tz.guess() ?? 'utc';
}

export function useLogout() {
  const logout = useEvent(() => {
    window.location.href = '/login'; // not good, need to invest to find better way.

    useUserStore.setState({ info: null });
    clearJWT();
  });

  return logout;
}
