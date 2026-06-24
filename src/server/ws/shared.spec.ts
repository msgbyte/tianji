import { afterEach, describe, expect, test, vi } from 'vitest';

type SharedModule = typeof import('./shared.js');
type SubscribeName = keyof import('./shared.js').SubscribeEventMap;

function createSocket(workspaceId: string) {
  return {
    id: `socket-${workspaceId}-${Math.random()}`,
    data: { workspaceId },
    emit: vi.fn(),
  } as any;
}

async function importShared(): Promise<SharedModule> {
  vi.resetModules();
  return import('./shared.js');
}

function subscribe(
  shared: SharedModule,
  socket: any,
  name: SubscribeName
) {
  let cursor: number | undefined;

  shared.socketEventBus.emit('$subscribe', { name }, socket, (value) => {
    cursor = value;
  });

  expect(cursor).toEqual(expect.any(Number));
  return cursor!;
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('websocket subscriptions', () => {
  test('cleans every subscription for a disconnected socket', async () => {
    const shared = await importShared();
    const socket = createSocket('workspace-a');
    const cursor = subscribe(shared, socket, 'onServerStatusUpdate');

    shared.subscribeEventBus.emit('onServerStatusUpdate', 'workspace-a', {
      ok: true,
    } as any);
    expect(socket.emit).toHaveBeenCalledWith(
      `onServerStatusUpdate#${cursor}`,
      { ok: true }
    );

    shared.cleanupSocketSubscriptions(socket);
    socket.emit.mockClear();

    shared.subscribeEventBus.emit('onServerStatusUpdate', 'workspace-a', {
      ok: false,
    } as any);

    expect(socket.emit).not.toHaveBeenCalled();
  });

  test('disconnect cleanup does not remove subscriptions from other sockets', async () => {
    const shared = await importShared();
    const socketA = createSocket('workspace-a');
    const socketB = createSocket('workspace-a');
    subscribe(shared, socketA, 'onServerStatusUpdate');
    const cursorB = subscribe(shared, socketB, 'onServerStatusUpdate');

    shared.cleanupSocketSubscriptions(socketA);

    shared.subscribeEventBus.emit('onServerStatusUpdate', 'workspace-a', {
      ok: true,
    } as any);

    expect(socketA.emit).not.toHaveBeenCalled();
    expect(socketB.emit).toHaveBeenCalledWith(
      `onServerStatusUpdate#${cursorB}`,
      { ok: true }
    );
  });

  test('manual unsubscribe removes the selected subscription', async () => {
    const shared = await importShared();
    const socket = createSocket('workspace-a');
    const cursor = subscribe(shared, socket, 'onServerStatusUpdate');

    shared.socketEventBus.emit(
      '$unsubscribe',
      { name: 'onServerStatusUpdate', cursor },
      socket,
      vi.fn()
    );

    shared.subscribeEventBus.emit('onServerStatusUpdate', 'workspace-a', {
      ok: true,
    } as any);

    expect(socket.emit).not.toHaveBeenCalled();
  });
});
