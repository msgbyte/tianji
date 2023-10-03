import { io, Socket } from 'socket.io-client';
import { getJWT } from './auth';
import type { SubscribeEventMap, SocketEventMap } from '../../server/ws/shared';
import { create } from 'zustand';
import { useEvent } from '../hooks/useEvent';
import { useEffect } from 'react';

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
        console.log('aaa');
        socket.on(`${name}#${cursor}` as string, receiveDataUpdate);
      });

      return unsubscribe;
    }
  );

  return { emit, subscribe };
}

export function useSocketSubscribe<T extends keyof SubscribeEventMap>(
  name: T,
  onData: (data: SubscribeEventData<T>) => void
) {
  const { subscribe } = useSocket();
  const cb = useEvent(onData);

  useEffect(() => {
    const unsubscribe = subscribe(name, cb);

    return () => {
      unsubscribe();
    };
  }, [name]);
}
