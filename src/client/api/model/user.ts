import dayjs from 'dayjs';
import { useUserStore } from '../../store/user';
import { useEvent } from '../../hooks/useEvent';
import { clearJWT } from '../auth';
import { useNavigate } from '@tanstack/react-router';

/**
 * Mock
 * return local, or fetch remote data
 */
export function getUserTimezone(): string {
  return dayjs.tz.guess() ?? 'utc';
}

export function useLogout() {
  const navigate = useNavigate();

  const logout = useEvent(() => {
    useUserStore.setState({ info: null });
    clearJWT();
    navigate({
      to: '/login',
      replace: true,
    });
  });

  return logout;
}
