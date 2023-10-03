import { EventEmitter } from 'eventemitter-strict';
import { Socket } from 'socket.io';
import { ServerStatusInfo } from '../../types';

type SubscribeEventFn<T> = (workspaceId: string, eventData: T) => void;

export interface SubscribeEventMap {
  onServerStatusUpdate: SubscribeEventFn<Record<string, ServerStatusInfo>>;
}

type SocketEventFn<T, U = unknown> = (
  eventData: T,
  socket: Socket,
  callback: (payload: U) => void
) => void;

export interface SocketEventMap {
  // test: SocketEventFn<number, number>
  $subscribe: SocketEventFn<{ name: keyof SubscribeEventMap }, number>;
  $unsubscribe: SocketEventFn<
    { name: keyof SubscribeEventMap; cursor: number },
    void
  >;
}

export const socketEventBus = new EventEmitter<SocketEventMap>();
export const subscribeEventBus = new EventEmitter<SubscribeEventMap>();

type SubscribeInitializerFn<
  T extends keyof SubscribeEventMap = keyof SubscribeEventMap
> = (
  workspaceId: string,
  socket: Socket
) =>
  | Parameters<SubscribeEventMap[T]>[1]
  | Promise<Parameters<SubscribeEventMap[T]>[1]>;
const subscribeInitializerList: [
  keyof SubscribeEventMap,
  SubscribeInitializerFn
][] = [];

let i = 0;
const subscribeFnMap: Record<string, SubscribeEventFn<any>> = {};
socketEventBus.on('$subscribe', (eventData, socket, callback) => {
  const _workspaceId = socket.data.workspaceId;
  const { name } = eventData;

  const cursor = i++;
  const fn: SubscribeEventMap[typeof name] = (workspaceId, data) => {
    if (workspaceId === '*' || _workspaceId === workspaceId) {
      socket.emit(`${name}#${cursor}`, data);
    }
  };

  subscribeEventBus.on(name, fn);

  subscribeFnMap[`${name}#${cursor}`] = fn;

  subscribeInitializerList.forEach(async ([_name, initializer]) => {
    if (_name === name) {
      socket.emit(`${name}#${cursor}`, await initializer(_workspaceId, socket));
    }
  });

  callback(cursor);
});
socketEventBus.on('$unsubscribe', (eventData, socket, callback) => {
  const { name, cursor } = eventData;

  const fn = subscribeFnMap[`${name}#${cursor}`];
  if (fn) {
    delete subscribeFnMap[`${name}#${cursor}`];
    subscribeEventBus.off(name, fn);
  }
});

/**
 * Listen for subscribed requests and return results immediately
 */
export function createSubscribeInitializer<T extends keyof SubscribeEventMap>(
  name: T,
  initializer: SubscribeInitializerFn
) {
  subscribeInitializerList.push([name, initializer]);
}
