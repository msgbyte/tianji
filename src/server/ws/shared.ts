import { EventEmitter } from 'eventemitter-strict';
import { Socket } from 'socket.io';
import {
  MaybePromise,
  PlaygroundWebhookRequestPayload,
  ServerStatusInfo,
} from '../../types/index.js';
import { FeedEvent, FeedState, MonitorData } from '@prisma/client';
import { Serialize } from '../types/utils.js';

type SubscribeEventFn<T> = (workspaceId: string, eventData: T) => void;

export interface SubscribeEventMap {
  onServerStatusUpdate: SubscribeEventFn<Record<string, ServerStatusInfo>>;
  onMonitorReceiveNewData: SubscribeEventFn<MonitorData>;
  onReceiveFeedEvent: SubscribeEventFn<Serialize<FeedEvent>>;
  onReceiveFeedState: SubscribeEventFn<Serialize<FeedState>>;
  onReceivePlaygroundWebhookRequest: SubscribeEventFn<PlaygroundWebhookRequestPayload>;
  onLighthouseWorkCompleted: SubscribeEventFn<{ websiteId: string }>;
  onSurveyClassifyWorkCompleted: SubscribeEventFn<{
    surveyId: string;
    analysisCount: number;
    processedCount: number;
    categorys: string[];
    effectCount: number;
  }>;
  onSurveyTranslationWorkCompleted: SubscribeEventFn<{
    surveyId: string;
    analysisCount: number;
    processedCount: number;
    effectCount: number;
  }>;
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

export const socketEventBus = new EventEmitter<SocketEventMap>(); // for system
export const subscribeEventBus = new EventEmitter<SubscribeEventMap>(); // for business

type SubscribeInitializerFn<
  T extends keyof SubscribeEventMap = keyof SubscribeEventMap,
> = (
  workspaceId: string,
  socket: Socket
) => MaybePromise<Parameters<SubscribeEventMap[T]>[1]> | MaybePromise<void>;
const subscribeInitializerList: [
  keyof SubscribeEventMap,
  SubscribeInitializerFn,
][] = [];

let i = 0;
const subscribeFnMap: Record<
  string,
  {
    name: keyof SubscribeEventMap;
    fn: SubscribeEventFn<any>;
  }
> = {};
const socketSubscribeKeyMap = new WeakMap<Socket, Set<string>>();

function getSubscribeKey(name: keyof SubscribeEventMap, cursor: number) {
  return `${name}#${cursor}`;
}

function removeSubscription(key: string) {
  const subscription = subscribeFnMap[key];
  if (!subscription) {
    return;
  }

  delete subscribeFnMap[key];
  subscribeEventBus.off(subscription.name, subscription.fn);
}

socketEventBus.on('$subscribe', (eventData, socket, callback) => {
  const _workspaceId = socket.data.workspaceId;
  const { name } = eventData;

  const cursor = i++;
  const fn: SubscribeEventFn<unknown> = (workspaceId, data) => {
    if (workspaceId === '*' || _workspaceId === workspaceId) {
      socket.emit(`${name}#${cursor}`, data);
    }
  };

  subscribeEventBus.on(name, fn);

  const key = getSubscribeKey(name, cursor);
  subscribeFnMap[key] = { name, fn };

  const socketSubscribeKeys = socketSubscribeKeyMap.get(socket) ?? new Set();
  socketSubscribeKeys.add(key);
  socketSubscribeKeyMap.set(socket, socketSubscribeKeys);

  subscribeInitializerList.forEach(async ([_name, initializer]) => {
    if (_name === name) {
      const res = await initializer(_workspaceId, socket);
      if (res) {
        socket.emit(`${name}#${cursor}`, res);
      }
    }
  });

  callback(cursor);
});
socketEventBus.on('$unsubscribe', (eventData, socket, callback) => {
  const { name, cursor } = eventData;
  const key = getSubscribeKey(name, cursor);

  removeSubscription(key);

  const socketSubscribeKeys = socketSubscribeKeyMap.get(socket);
  if (socketSubscribeKeys) {
    socketSubscribeKeys.delete(key);
    if (socketSubscribeKeys.size === 0) {
      socketSubscribeKeyMap.delete(socket);
    }
  }
});

export function cleanupSocketSubscriptions(socket: Socket) {
  const socketSubscribeKeys = socketSubscribeKeyMap.get(socket);
  if (!socketSubscribeKeys) {
    return;
  }

  for (const key of socketSubscribeKeys) {
    removeSubscription(key);
  }

  socketSubscribeKeyMap.delete(socket);
}

/**
 * Listen for subscribed requests and return results immediately
 */
export function createSubscribeInitializer<T extends keyof SubscribeEventMap>(
  name: T,
  initializer: SubscribeInitializerFn
) {
  subscribeInitializerList.push([name, initializer]);
}
