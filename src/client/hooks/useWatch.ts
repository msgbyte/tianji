import { DependencyList, useLayoutEffect } from 'react';
import { useEvent } from './useEvent';

/**
 * 监听变更并触发回调
 */
export function useWatch(deps: DependencyList, cb: () => void) {
  const memoizedFn = useEvent(cb);
  useLayoutEffect(() => {
    memoizedFn();
  }, deps);
}
