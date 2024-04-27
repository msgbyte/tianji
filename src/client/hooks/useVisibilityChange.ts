import { useEffect } from 'react';
import { useEvent } from './useEvent';

export function useVisibilityChange(callback: (visibility: boolean) => void) {
  const fn = useEvent(callback);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fn(true);
      } else {
        fn(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
