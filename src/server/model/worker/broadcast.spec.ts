import { afterEach, describe, expect, test, vi } from 'vitest';
import { logger } from '../../utils/logger.js';
import {
  WORKER_CRON_BROADCAST_CHANNEL,
  WorkerCronBroadcast,
  type WorkerCronBroadcastEvent,
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

  emitRaw(raw: string, channel = WORKER_CRON_BROADCAST_CHANNEL) {
    this.emit('message', channel, raw);
  }

  emitMessage(event: WorkerCronBroadcastEvent) {
    this.emitRaw(JSON.stringify(event));
  }
}

function createHarness(instanceId = 'instance-a') {
  const publisher = new FakeRedisClient();
  const subscriber = new FakeRedisClient();
  const clients = [publisher, subscriber];
  const createClient = vi.fn(() => clients.shift()!);
  const broadcast = new WorkerCronBroadcast(
    'redis://localhost:6379',
    instanceId,
    createClient
  );

  return { broadcast, publisher, subscriber, createClient };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('WorkerCronBroadcast', () => {
  test('does not construct redis clients without a redis url', async () => {
    const createClient = vi.fn();
    const broadcast = new WorkerCronBroadcast(
      undefined,
      'instance-a',
      createClient
    );

    await expect(
      broadcast.start(vi.fn(), vi.fn(), 50)
    ).resolves.toBe(true);

    expect(createClient).not.toHaveBeenCalled();
  });

  test('successful initial subscription does not invoke recovery', async () => {
    const { broadcast, subscriber } = createHarness();
    const recovery = vi.fn();

    await expect(
      broadcast.start(vi.fn(), recovery, 50)
    ).resolves.toBe(true);

    expect(subscriber.subscribe).toHaveBeenCalledWith(
      WORKER_CRON_BROADCAST_CHANNEL
    );
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
  });

  test('unresolved initial subscription times out', async () => {
    vi.useFakeTimers();
    const { broadcast, subscriber } = createHarness();
    subscriber.subscribe.mockReturnValue(new Promise(() => undefined));

    const started = broadcast.start(vi.fn(), vi.fn(), 50);
    await vi.advanceTimersByTimeAsync(50);

    await expect(started).resolves.toBe(false);
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

  test('delivers valid worker messages from another instance', async () => {
    const { broadcast, subscriber } = createHarness();
    const handler = vi.fn();
    await broadcast.start(handler, vi.fn(), 50);

    subscriber.emitMessage({
      action: 'update',
      workspaceId: 'workspace-a',
      workerId: 'worker-a',
      sourceInstanceId: 'instance-b',
    });

    expect(handler).toHaveBeenCalledWith({
      action: 'update',
      workspaceId: 'workspace-a',
      workerId: 'worker-a',
      sourceInstanceId: 'instance-b',
    });
  });

  test('ignores self-originated, malformed, and other-channel messages', async () => {
    const { broadcast, subscriber } = createHarness();
    const handler = vi.fn();
    await broadcast.start(handler, vi.fn(), 50);

    subscriber.emitMessage({
      action: 'update',
      workspaceId: 'workspace-a',
      workerId: 'worker-a',
      sourceInstanceId: 'instance-a',
    });
    subscriber.emitRaw('{');
    subscriber.emitRaw(JSON.stringify({ action: 'update' }));
    subscriber.emitRaw(
      JSON.stringify({
        action: 'update',
        workspaceId: 'workspace-a',
        workerId: 'worker-a',
        sourceInstanceId: 'instance-b',
      }),
      'another-channel'
    );

    expect(handler).not.toHaveBeenCalled();
  });

  test('publishes the worker event with the current instance id', async () => {
    const { broadcast, publisher } = createHarness();
    await broadcast.start(vi.fn(), vi.fn(), 50);

    await broadcast.publish('update', 'workspace-a', 'worker-a');

    expect(publisher.publish).toHaveBeenCalledWith(
      WORKER_CRON_BROADCAST_CHANNEL,
      JSON.stringify({
        action: 'update',
        workspaceId: 'workspace-a',
        workerId: 'worker-a',
        sourceInstanceId: 'instance-a',
      })
    );
  });

  test('close quits both clients and disables later activity', async () => {
    const { broadcast, publisher, subscriber } = createHarness();
    const handler = vi.fn();
    const recovery = vi.fn();
    await broadcast.start(handler, recovery, 50);

    await broadcast.close();
    subscriber.emit('ready');
    subscriber.emitMessage({
      action: 'delete',
      workspaceId: 'workspace-a',
      workerId: 'worker-a',
      sourceInstanceId: 'instance-b',
    });
    await broadcast.publish('delete', 'workspace-a', 'worker-a');

    expect(publisher.quit).toHaveBeenCalledOnce();
    expect(subscriber.quit).toHaveBeenCalledOnce();
    expect(subscriber.subscribe).toHaveBeenCalledOnce();
    expect(publisher.publish).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
    expect(recovery).not.toHaveBeenCalled();
  });

  test('absorbs handler, publish, recovery, and cleanup failures', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const { broadcast, publisher, subscriber } = createHarness();
    const handler = vi.fn(async () => {
      throw new Error('handler failed');
    });
    const recovery = vi.fn(async () => {
      throw new Error('recovery failed');
    });
    publisher.publish.mockRejectedValue(new Error('publish failed'));
    publisher.quit.mockRejectedValue(new Error('publisher quit failed'));
    subscriber.quit.mockRejectedValue(new Error('subscriber quit failed'));
    await broadcast.start(handler, recovery, 50);

    subscriber.emitMessage({
      action: 'update',
      workspaceId: 'workspace-a',
      workerId: 'worker-a',
      sourceInstanceId: 'instance-b',
    });
    subscriber.emit('close');
    subscriber.emit('ready');

    await expect(
      broadcast.publish('update', 'workspace-a', 'worker-a')
    ).resolves.toBeUndefined();
    await expect(broadcast.close()).resolves.toBeUndefined();
    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
      expect(recovery).toHaveBeenCalledOnce();
    });
  });
});
