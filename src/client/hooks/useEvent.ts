import { useMemo, useRef, useState } from 'react';

// From https://github.com/alibaba/hooks/blob/master/packages/hooks/src/useMemoizedFn/index.ts

type Noop = (this: any, ...args: any[]) => any;

type PickFunction<T extends Noop> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T>;

export function useEvent<T extends Noop>(fn: T) {
  if (process.env.NODE_ENV === 'development') {
    if (typeof fn !== 'function') {
      console.error(
        `useMemoizedFn expected parameter is a function, got ${typeof fn}`
      );
    }
  }

  const fnRef = useRef<T>(fn);

  // why not write `fnRef.current = fn`?
  // https://github.com/alibaba/hooks/issues/728
  fnRef.current = useMemo(() => fn, [fn]);

  const memoizedFn = useRef<PickFunction<T>>();
  if (!memoizedFn.current) {
    memoizedFn.current = function (this, ...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return memoizedFn.current as T;
}

/**
 * Same with useEvent but return loading state
 */
export function useEventWithLoading<T extends (...args: any[]) => Promise<any>>(
  fn: T
): [T, boolean] {
  const [isLoading, setIsLoading] = useState(false);

  const _fn = useEvent(async (...args: Parameters<T>) => {
    setIsLoading(true);
    try {
      return await fn(...args);
    } finally {
      setIsLoading(false);
    }
  }) as T;

  return [_fn as T, isLoading];
}
