import { io, Socket } from 'socket.io-client';
import { getJWT } from './auth';
import type { SubscribeEventMap, SocketEventMap } from '../../server/ws/shared';
import { create } from 'zustand';
import { useEvent } from '../hooks/useEvent';
import { useEffect, useReducer, useState } from 'react';
import { useIsLogined, useUserInfo } from '../store/user';

const useSocketStore = create<{
  socket: Socket | null;
}>(() => ({
  socket: null,
}));

export function createSocketIOClient(workspaceId: string) {
  const token = getJWT();
  const socket = io(`/${workspaceId}`, {
    transports: ['websocket'],
    reconnectionDelayMax: 10000,
    auth: {
      token,
    },
    forceNew: true,
  });

  useSocketStore.setState({
    socket,
  });
}

type SocketEventData<Name extends keyof SocketEventMap> = Parameters<
  SocketEventMap[Name]
>[0];

type SocketEventRet<Name extends keyof SocketEventMap> = Parameters<
  Parameters<SocketEventMap[Name]>[2]
>[0];

type SubscribeEventData<Name extends keyof SubscribeEventMap> = Parameters<
  SubscribeEventMap[Name]
>[1];

export function useSocket() {
  const socket = useSocketStore((state) => state.socket);

  const emit = useEvent(
    async <T extends keyof SocketEventMap>(
      eventName: T,
      eventData: SocketEventData<T>
    ): Promise<SocketEventRet<T>> => {
      if (!socket) {
        throw new Error('Socketio not init');
      }

      return await socket.emitWithAck(eventName, eventData);
    }
  );

  const subscribe = useEvent(
    <T extends keyof SubscribeEventMap>(
      name: T,
      onData: (data: SubscribeEventData<T>) => void
    ) => {
      if (!socket) {
        throw new Error('Socketio not init');
      }

      const p = emit('$subscribe', { name });

      const receiveDataUpdate = (data: any) => {
        onData(data);
      };

      const unsubscribe = () => {
        Promise.resolve(p).then((cursor) => {
          emit('$unsubscribe', { name, cursor });
          socket.off(`${name}#${cursor}` as string, receiveDataUpdate);
        });
      };

      Promise.resolve(p).then((cursor) => {
        socket.on(`${name}#${cursor}` as string, receiveDataUpdate);
      });

      return unsubscribe;
    }
  );

  return { emit, subscribe };
}

export function useSocketSubscribe<T>(
  name: keyof SubscribeEventMap,
  defaultData: T
): T {
  const { subscribe } = useSocket();
  const [data, setData] = useState<T>(defaultData);

  const cb = useEvent((_data) => {
    setData(_data ?? defaultData);
  });

  useEffect(() => {
    const unsubscribe = subscribe(name, cb);

    return () => {
      unsubscribe();
    };
  }, [name]);

  return data;
}

interface UseSocketSubscribeListOptions<K, T> {
  filter?: (data: T) => boolean;
}
const defaultFilter = () => true;
export function useSocketSubscribeList<
  K extends keyof SubscribeEventMap = keyof SubscribeEventMap,
  T = SubscribeEventData<K>
>(name: K, options: UseSocketSubscribeListOptions<K, T> = {}): T[] {
  const { filter = defaultFilter } = options;
  const { subscribe } = useSocket();
  const isLogined = useIsLogined();
  const [list, push] = useReducer(
    (state: T[], data: T) => [...state, data],
    [] as T[]
  );

  const cb = useEvent((_data) => {
    if (filter(_data)) {
      push(_data);
    }
  });

  useEffect(() => {
    if (!isLogined) {
      console.warn('Skip socket subscribe login because of not login');
      return;
    }

    const unsubscribe = subscribe(name, cb);

    return () => {
      unsubscribe();
    };
  }, [name]);

  return list;
}
