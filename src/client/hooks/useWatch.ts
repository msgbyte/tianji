import { DependencyList, useLayoutEffect } from 'react';
import { useEvent } from './useEvent';

/**
 * Listen for changes and trigger callbacks
 */
export function useWatch(deps: DependencyList, cb: () => void) {
  const memoizedFn = useEvent(cb);
  useLayoutEffect(() => {
    memoizedFn();
  }, deps);
}
