import { useEvent } from '@/hooks/useEvent';
import { EventEmitter } from 'eventemitter-strict';
import { useEffect } from 'react';

export interface GlobalEventMap {
  commonListSelected: () => void;
}

export const globalEventBus = new EventEmitter<GlobalEventMap>();

export function useGlobalEventSubscribe<T extends keyof GlobalEventMap>(
  eventName: T,
  callback: GlobalEventMap[T]
) {
  const fn = useEvent(callback);

  useEffect(() => {
    globalEventBus.on(eventName, fn);

    return () => {
      globalEventBus.off(eventName, fn);
    };
  }, [eventName]);
}
