import { afterEach, describe, expect, test, vi } from 'vitest';
import { logger } from '../../utils/logger.js';
import {
  MONITOR_BROADCAST_CHANNEL,
  MonitorBroadcast,
  type MonitorBroadcastEvent,
} from './broadcast.js';

type Listener = (...args: any[]) => void;

class FakeRedisClient {
  private listeners = new Map<string, Listener[]>();

  on = vi.fn((event: string, listener: Listener) => {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
    return this;
  });

  subscribe = vi.fn(async () => 1);
  publish = vi.fn(async () => 1);
  quit = vi.fn(async () => 'OK');

  emit(event: string, ...args: unknown[]) {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }

  emitRaw(raw: string, channel = MONITOR_BROADCAST_CHANNEL) {
    this.emit('message', channel, raw);
  }

  emitMessage(event: MonitorBroadcastEvent) {
    this.emitRaw(JSON.stringify(event));
  }
}

function createHarness(instanceId = 'instance-a') {
  const publisher = new FakeRedisClient();
  const subscriber = new FakeRedisClient();
  const clients = [publisher, subscriber];
  const createClient = vi.fn(() => clients.shift()!);
  const broadcast = new MonitorBroadcast(
    'redis://localhost:6379',
    instanceId,
    createClient
  );

  return { broadcast, publisher, subscriber, createClient };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('MonitorBroadcast', () => {
  test('does not construct redis clients without a redis url', async () => {
    const createClient = vi.fn();
    const broadcast = new MonitorBroadcast(
      undefined,
      'instance-a',
      createClient
    );

    await expect(
      broadcast.start(vi.fn(), vi.fn(), 50)
    ).resolves.toBe(true);

    expect(createClient).not.toHaveBeenCalled();
  });

  test('does not start after close without a redis url', async () => {
    const createClient = vi.fn();
    const broadcast = new MonitorBroadcast(
      undefined,
      'instance-a',
      createClient
    );

    await broadcast.close();

    await expect(
      broadcast.start(vi.fn(), vi.fn(), 50)
    ).resolves.toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  test('successful initial subscription does not invoke recovery', async () => {
    const { broadcast, subscriber } = createHarness();
    const recovery = vi.fn();

    await expect(
      broadcast.start(vi.fn(), recovery, 50)
    ).resolves.toBe(true);

    expect(subscriber.subscribe).toHaveBeenCalledOnce();
    expect(recovery).not.toHaveBeenCalled();
  });

  test('concurrent starts share the initial subscription result', async () => {
    const { broadcast, subscriber, createClient } = createHarness();
    const subscription = deferred<number>();
    subscriber.subscribe.mockReturnValue(subscription.promise);

    const firstStart = broadcast.start(vi.fn(), vi.fn(), 50);
    const secondStart = broadcast.start(vi.fn(), vi.fn(), 50);

    expect(createClient).toHaveBeenCalledTimes(2);
    expect(subscriber.subscribe).toHaveBeenCalledOnce();

    subscription.resolve(1);

    await expect(Promise.all([firstStart, secondStart])).resolves.toEqual([
      true,
      true,
    ]);
    expect(createClient).toHaveBeenCalledTimes(2);
  });

  test('unresolved initial subscription times out', async () => {
    vi.useFakeTimers();
    const { broadcast, subscriber } = createHarness();
    subscriber.subscribe.mockReturnValue(new Promise(() => undefined));

    const started = broadcast.start(vi.fn(), vi.fn(), 50);
    await vi.advanceTimersByTimeAsync(50);

    await expect(started).resolves.toBe(false);
  });

  test('failed initial subscription retries after a later ready event', async () => {
    vi.useFakeTimers();
    vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const { broadcast, subscriber } = createHarness();
    subscriber.subscribe.mockRejectedValueOnce(new Error('subscribe failed'));
    const recovery = vi.fn();

    const started = broadcast.start(vi.fn(), recovery, 50);
    await Promise.resolve();
    await Promise.resolve();
    expect(subscriber.subscribe).toHaveBeenCalledOnce();
    subscriber.emit('ready');

    await expect(started).resolves.toBe(true);
    expect(subscriber.subscribe).toHaveBeenCalledTimes(2);
    expect(recovery).not.toHaveBeenCalled();
  });

  test('late first subscription invokes recovery', async () => {
    vi.useFakeTimers();
    const { broadcast, subscriber } = createHarness();
    const subscription = deferred<number>();
    const recovery = vi.fn(async () => undefined);
    subscriber.subscribe.mockReturnValue(subscription.promise);

    const started = broadcast.start(vi.fn(), recovery, 50);
    await vi.advanceTimersByTimeAsync(50);
    await expect(started).resolves.toBe(false);

    subscription.resolve(1);
    await vi.waitFor(() => {
      expect(recovery).toHaveBeenCalledOnce();
    });
  });

  test('close followed by ready neither subscribes nor recovers', async () => {
    const { broadcast, subscriber } = createHarness();
    const recovery = vi.fn(async () => undefined);
    await broadcast.start(vi.fn(), recovery, 50);

    await broadcast.close();
    subscriber.emit('ready');

    expect(subscriber.subscribe).toHaveBeenCalledOnce();
    expect(recovery).not.toHaveBeenCalled();
  });

  test('reconnect resubscribes and invokes recovery', async () => {
    const { broadcast, subscriber } = createHarness();
    const recovery = vi.fn(async () => undefined);
    await broadcast.start(vi.fn(), recovery, 50);

    subscriber.emit('close');
    subscriber.emit('ready');

    await vi.waitFor(() => {
      expect(subscriber.subscribe).toHaveBeenCalledTimes(2);
      expect(recovery).toHaveBeenCalledOnce();
    });
  });

  test('reconnect replaces an in-flight subscription attempt', async () => {
    vi.useFakeTimers();
    const { broadcast, subscriber } = createHarness();
    const staleSubscription = deferred<number>();
    const freshSubscription = deferred<number>();
    const recovery = vi.fn(async () => undefined);
    subscriber.subscribe
      .mockReturnValueOnce(staleSubscription.promise)
      .mockReturnValueOnce(freshSubscription.promise);

    const started = broadcast.start(vi.fn(), recovery, 50);
    subscriber.emit('close');
    subscriber.emit('ready');

    expect(subscriber.subscribe).toHaveBeenCalledTimes(2);
    staleSubscription.resolve(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(1);

    freshSubscription.resolve(1);
    await expect(started).resolves.toBe(true);
    expect(recovery).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  test('close quits both clients and disables later activity', async () => {
    const { broadcast, publisher, subscriber } = createHarness();
    const handler = vi.fn();
    const recovery = vi.fn(async () => undefined);
    await broadcast.start(handler, recovery, 50);

    await broadcast.close();
    subscriber.emit('ready');
    subscriber.emitMessage({
      action: 'stop',
      workspaceId: 'workspace-a',
      monitorId: 'monitor-a',
      sourceInstanceId: 'instance-b',
    });
    await broadcast.publish('stop', 'workspace-a', 'monitor-a');

    expect(publisher.quit).toHaveBeenCalledOnce();
    expect(subscriber.quit).toHaveBeenCalledOnce();
    expect(subscriber.subscribe).toHaveBeenCalledOnce();
    expect(publisher.publish).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    expect(recovery).not.toHaveBeenCalled();
  });

  test('concurrent closes both wait for both clients to quit', async () => {
    const { broadcast, publisher, subscriber } = createHarness();
    const publisherQuit = deferred<string>();
    const subscriberQuit = deferred<string>();
    publisher.quit.mockReturnValue(publisherQuit.promise);
    subscriber.quit.mockReturnValue(subscriberQuit.promise);
    await broadcast.start(vi.fn(), vi.fn(), 50);

    let firstClosed = false;
    let secondClosed = false;
    const firstClosing = broadcast.close().then(() => {
      firstClosed = true;
    });
    const secondClosing = broadcast.close().then(() => {
      secondClosed = true;
    });
    await Promise.resolve();
    expect(firstClosed).toBe(false);
    expect(secondClosed).toBe(false);

    publisherQuit.resolve('OK');
    await Promise.resolve();
    expect(firstClosed).toBe(false);
    expect(secondClosed).toBe(false);

    subscriberQuit.resolve('OK');
    await Promise.all([firstClosing, secondClosing]);
    expect(firstClosed).toBe(true);
    expect(secondClosed).toBe(true);
  });

  test('subscribes and delivers valid messages from another instance', async () => {
    const { broadcast, subscriber } = createHarness();
    const handler = vi.fn();
    await broadcast.start(handler, vi.fn(), 50);

    subscriber.emitMessage({
      action: 'stop',
      workspaceId: 'workspace-a',
      monitorId: 'monitor-a',
      sourceInstanceId: 'instance-b',
    });

    expect(subscriber.subscribe).toHaveBeenCalledWith(
      MONITOR_BROADCAST_CHANNEL
    );
    expect(handler).toHaveBeenCalledWith({
      action: 'stop',
      workspaceId: 'workspace-a',
      monitorId: 'monitor-a',
      sourceInstanceId: 'instance-b',
    });
  });

  test('ignores messages from the same instance', async () => {
    const { broadcast, subscriber } = createHarness();
    const handler = vi.fn();
    await broadcast.start(handler, vi.fn(), 50);

    subscriber.emitMessage({
      action: 'stop',
      workspaceId: 'workspace-a',
      monitorId: 'monitor-a',
      sourceInstanceId: 'instance-a',
    });

    expect(handler).not.toHaveBeenCalled();
  });

  test('ignores malformed messages and messages on other channels', async () => {
    const { broadcast, subscriber } = createHarness();
    const handler = vi.fn();
    await broadcast.start(handler, vi.fn(), 50);

    subscriber.emitRaw('{');
    subscriber.emitRaw(JSON.stringify({ action: 'stop' }));
    subscriber.emitRaw(
      JSON.stringify({
        action: 'stop',
        workspaceId: 'workspace-a',
        monitorId: 'monitor-a',
        sourceInstanceId: 'instance-b',
      }),
      'another-channel'
    );

    expect(handler).not.toHaveBeenCalled();
  });

  test('publishes the current instance id', async () => {
    const { broadcast, publisher } = createHarness();
    await broadcast.start(vi.fn(), vi.fn(), 50);

    await broadcast.publish('start', 'workspace-a', 'monitor-a');

    expect(publisher.publish).toHaveBeenCalledWith(
      MONITOR_BROADCAST_CHANNEL,
      JSON.stringify({
        action: 'start',
        workspaceId: 'workspace-a',
        monitorId: 'monitor-a',
        sourceInstanceId: 'instance-a',
      })
    );
  });

  test('absorbs subscription, handler, and publish failures', async () => {
    vi.useFakeTimers();
    vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const { broadcast, publisher, subscriber } = createHarness();
    subscriber.subscribe.mockRejectedValue(new Error('subscribe failed'));
    publisher.publish.mockRejectedValue(new Error('publish failed'));
    const handler = vi.fn(async () => {
      throw new Error('handler failed');
    });

    const started = broadcast.start(handler, vi.fn(), 50);
    await vi.advanceTimersByTimeAsync(50);
    await expect(started).resolves.toBe(false);
    subscriber.emitMessage({
      action: 'update',
      workspaceId: 'workspace-a',
      monitorId: 'monitor-a',
      sourceInstanceId: 'instance-b',
    });

    await expect(
      broadcast.publish('stop', 'workspace-a', 'monitor-a')
    ).resolves.toBeUndefined();
    await vi.waitFor(() => {
      expect(logger.error).toHaveBeenCalledTimes(3);
    });

    await broadcast.close();
  });
});
