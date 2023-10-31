import { useEffect, useReducer } from 'react';

export function useIntervalUpdate(timeout: number) {
  // update list in 10 second
  const [inc, update] = useReducer((state) => state + 1, 0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      update();
    }, timeout);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return inc;
}
