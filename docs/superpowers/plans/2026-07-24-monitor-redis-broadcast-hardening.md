# Monitor Redis Broadcast Hardening Implementation Plan

> **For Codex:** Execute this plan with `superpowers:test-driven-development`. Complete each red/green/refactor cycle and commit before moving to the next task.

**Goal:** Make optional Redis-based Monitor lifecycle synchronization safe across concurrent events, stale messages, Redis reconnects, database failures, and graceful shutdown.

**Architecture:** PostgreSQL remains authoritative. `MonitorManager` serializes every transition for the same Monitor ID through a Promise-tail queue, while allowing different IDs to run concurrently. Redis Pub/Sub only signals that state may have changed; startup and reconnect recovery reconcile database state with process-local runners.

**Tech Stack:** TypeScript, Prisma, ioredis, Vitest, pnpm

---

## Task 1: Serialize runner reconciliation and make PostgreSQL authoritative

**Files:**

- Modify: `src/server/model/monitor/manager.spec.ts`
- Modify: `src/server/model/monitor/manager.ts`

### Step 1: Add failing manager concurrency and stale-message tests

Add a reusable deferred helper near the test fixtures:

```ts
function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
```

Replace the existing direct-removal expectations for remote `stop` and `delete` with database-authoritative expectations, then add these tests:

```ts
test.each(['stop', 'delete'] as const)(
  'remote %s reconciles current active database state',
  async (action) => {
    const manager = new MonitorManager();
    const oldRunner = seedRunner(manager);
    mocks.prisma.monitor.findUnique.mockResolvedValue(activeMonitor);

    await manager.handleBroadcast(remoteEvent(action));

    expect(mocks.prisma.monitor.findUnique).toHaveBeenCalledOnce();
    expect(oldRunner.stopMonitor).toHaveBeenCalledOnce();
    expect(mocks.runnerInstances[1].startMonitor).toHaveBeenCalledOnce();
    expect(manager.getRunner('monitor-a')).toBe(mocks.runnerInstances[1]);
  }
);

test('serializes overlapping reconciliation for one monitor', async () => {
  const manager = new MonitorManager();
  const firstLookup = deferred<typeof workspace>();
  mocks.prisma.monitor.findUnique.mockResolvedValue(activeMonitor);
  mocks.prisma.workspace.findUniqueOrThrow
    .mockReturnValueOnce(firstLookup.promise)
    .mockResolvedValueOnce(workspace);

  const first = manager.reconcile('workspace-a', 'monitor-a');
  await vi.waitFor(() => {
    expect(mocks.prisma.workspace.findUniqueOrThrow).toHaveBeenCalledTimes(1);
  });
  const second = manager.reconcile('workspace-a', 'monitor-a');

  expect(mocks.prisma.monitor.findUnique).toHaveBeenCalledTimes(1);
  firstLookup.resolve(workspace);
  await first;
  await second;

  expect(mocks.prisma.monitor.findUnique).toHaveBeenCalledTimes(2);
  expect(mocks.runnerInstances).toHaveLength(2);
  expect(mocks.runnerInstances[0].stopMonitor).toHaveBeenCalledOnce();
  expect(manager.getRunner('monitor-a')).toBe(mocks.runnerInstances[1]);
});

test('does not globally serialize different monitors', async () => {
  const manager = new MonitorManager();
  const workspaceALookup = deferred<typeof workspace>();
  const monitorB = {
    ...activeMonitor,
    id: 'monitor-b',
    workspaceId: 'workspace-b',
  };
  mocks.prisma.monitor.findUnique.mockImplementation(({ where }: any) =>
    Promise.resolve(where.id === 'monitor-a' ? activeMonitor : monitorB)
  );
  mocks.prisma.workspace.findUniqueOrThrow.mockImplementation(
    ({ where }: any) =>
      where.id === 'workspace-a'
        ? workspaceALookup.promise
        : Promise.resolve({ ...workspace, id: 'workspace-b' })
  );

  const first = manager.reconcile('workspace-a', 'monitor-a');
  const second = manager.reconcile('workspace-b', 'monitor-b');

  await second;
  expect(manager.getRunner('monitor-b')).toBeDefined();
  expect(manager.getRunner('monitor-a')).toBeUndefined();

  workspaceALookup.resolve(workspace);
  await first;
});

test('continues a monitor queue after a rejected operation', async () => {
  const manager = new MonitorManager();
  mocks.prisma.monitor.findUnique
    .mockRejectedValueOnce(new Error('lookup failed'))
    .mockResolvedValueOnce(activeMonitor);

  await expect(
    manager.reconcile('workspace-a', 'monitor-a')
  ).rejects.toThrow('lookup failed');
  await expect(
    manager.reconcile('workspace-a', 'monitor-a')
  ).resolves.toBeUndefined();

  expect(manager.getRunner('monitor-a')).toBeDefined();
});
```

Add a full-reconciliation test. Seed one stale local runner and return a different active Monitor from `findMany`. Make `findUnique` return the active row for the active ID and `null` for the stale ID. Assert that the missing runner starts and the stale runner stops and is removed:

```ts
test('reconcileAll starts missing active runners and removes stale runners', async () => {
  const manager = new MonitorManager();
  const staleRunner = seedRunner(manager);
  const activeB = {
    ...activeMonitor,
    id: 'monitor-b',
    workspaceId: 'workspace-b',
  };
  mocks.prisma.monitor.findMany.mockResolvedValue([
    { id: 'monitor-b', workspaceId: 'workspace-b' },
  ]);
  mocks.prisma.monitor.findUnique.mockImplementation(({ where }: any) =>
    Promise.resolve(where.id === 'monitor-b' ? activeB : null)
  );
  mocks.prisma.workspace.findUniqueOrThrow.mockResolvedValue({
    ...workspace,
    id: 'workspace-b',
  });

  await manager.reconcileAll();

  expect(staleRunner.stopMonitor).toHaveBeenCalledOnce();
  expect(manager.getRunner('monitor-a')).toBeUndefined();
  expect(manager.getRunner('monitor-b')).toBeDefined();
});
```

### Step 2: Run the manager tests and confirm RED

Run:

```bash
pnpm --dir src/server exec vitest run model/monitor/manager.spec.ts
```

Expected: failures show same-ID operations overlap, remote stop/delete skip PostgreSQL, and `reconcileAll` does not exist.

### Step 3: Implement the per-Monitor lifecycle queue

In `MonitorManager`, add:

```ts
private lifecycleTails = new Map<string, Promise<void>>();

private runLifecycle<T>(
  monitorId: string,
  operation: () => Promise<T>
): Promise<T> {
  const previous = this.lifecycleTails.get(monitorId) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);
  const tail = result.then(
    () => undefined,
    () => undefined
  );
  this.lifecycleTails.set(monitorId, tail);

  return result.finally(() => {
    if (this.lifecycleTails.get(monitorId) === tail) {
      this.lifecycleTails.delete(monitorId);
    }
  });
}
```

Extract an unqueued `reconcileUnlocked(workspaceId, monitorId)` containing the current database lookup and runner application. Make public `reconcile` call `runLifecycle`. Make every action in `handleBroadcast` call `reconcile`; do not directly remove on `stop` or `delete`.

Keep runner replacement inside the queue. In `createRunner`, resolve the workspace before stopping the existing runner so a failed workspace lookup does not destroy a valid runner:

```ts
const workspace = await prisma.workspace.findUniqueOrThrow({
  where: {
    id: monitor.workspaceId,
  },
});
this.removeRunner(monitor.id);
const runner = new MonitorRunner(workspace, monitor);
this.monitorRunner[monitor.id] = runner;
this.updateRunnerMetric();
return runner;
```

### Step 4: Implement full reconciliation and startup reuse

Add:

```ts
async reconcileAll(): Promise<void>
```

It must:

1. query active rows using `select: { id: true, workspaceId: true }`;
2. build a map containing those rows plus each local runner's `monitor.id` and `monitor.workspaceId`;
3. call public `reconcile` for every entry with `Promise.all`;
4. catch each per-Monitor error, log it, and allow other IDs to finish.

Change `startAll()` to await `reconcileAll()` and log completion. Preserve the one-call guard, but reset `isStarted` to `false` if startup reconciliation rejects before its per-ID error isolation.

Change `ensureRunner()` to use `await this.reconcile(workspaceId, monitorId)` when no runner exists, then return `getRunner(monitorId)` or throw `Monitor not found or inactive`. This keeps on-demand creation on the same lifecycle queue.

### Step 5: Run manager tests and confirm GREEN

Run:

```bash
pnpm --dir src/server exec vitest run model/monitor/manager.spec.ts
```

Expected: all manager tests pass.

### Step 6: Commit Task 1

```bash
git add src/server/model/monitor/manager.ts src/server/model/monitor/manager.spec.ts
git diff --cached --check
git commit -m "fix(monitor): serialize runner reconciliation"
```

---

## Task 2: Make local mutation ordering failure-safe

**Files:**

- Modify: `src/server/model/monitor/manager.spec.ts`
- Modify: `src/server/model/monitor/manager.ts`
- Modify: `src/server/trpc/routers/workspace.ts`

### Step 1: Add failing mutation-order tests

Extend the failed deletion test to prove the existing runner is untouched:

```ts
test('failed deletion preserves its runner and is not broadcast', async () => {
  const manager = new MonitorManager();
  const runner = seedRunner(manager);
  mocks.prisma.monitor.delete.mockRejectedValue(new Error('delete failed'));

  await expect(
    manager.delete('workspace-a', 'monitor-a')
  ).rejects.toThrow('delete failed');

  expect(runner.stopMonitor).not.toHaveBeenCalled();
  expect(manager.getRunner('monitor-a')).toBe(runner);
  expect(mocks.monitorBroadcast.publish).not.toHaveBeenCalled();
});
```

Add tests proving a committed database mutation broadcasts before a local runner rebuild error:

```ts
test('successful update publishes when local runner rebuild fails', async () => {
  const manager = new MonitorManager();
  mocks.prisma.monitor.update.mockResolvedValue(activeMonitor);
  mocks.prisma.workspace.findUniqueOrThrow.mockRejectedValue(
    new Error('workspace failed')
  );

  await expect(
    manager.upsert({ ...createInput, id: 'monitor-a' } as any)
  ).rejects.toThrow('workspace failed');

  expect(mocks.monitorBroadcast.publish).toHaveBeenCalledWith(
    'update',
    'workspace-a',
    'monitor-a'
  );
});

test('successful active change publishes when local runner rebuild fails', async () => {
  const manager = new MonitorManager();
  mocks.prisma.monitor.update.mockResolvedValue(activeMonitor);
  mocks.prisma.workspace.findUniqueOrThrow.mockRejectedValue(
    new Error('workspace failed')
  );

  await expect(
    manager.setActive('workspace-a', 'monitor-a', true)
  ).rejects.toThrow('workspace failed');

  expect(mocks.monitorBroadcast.publish).toHaveBeenCalledWith(
    'start',
    'workspace-a',
    'monitor-a'
  );
});
```

Add one overlap test where `setActive(false)` is blocked in Prisma and a remote event for the same ID is submitted. Assert the remote `findUnique` does not run until the mutation resolves. This proves local writes and remote reconciliation share the same queue.

### Step 2: Run the manager tests and confirm RED

Run:

```bash
pnpm --dir src/server exec vitest run model/monitor/manager.spec.ts
```

Expected: deletion stops the runner before Prisma rejects, update/setActive can fail before publish, and mutations are not queued.

### Step 3: Route update, active change, and delete through the queue

Add an `applyMonitorStateUnlocked(monitor)` helper:

```ts
private async applyMonitorStateUnlocked(
  monitor: MonitorWithNotification
): Promise<MonitorRunner | undefined> {
  if (!monitor.active) {
    this.removeRunner(monitor.id);
    return undefined;
  }

  const runner = await this.createRunner(monitor);
  await runner.startMonitor();
  return runner;
}
```

For an update (`upsert` with an ID), wrap Prisma update, fire-and-forget publish, and local state application in `runLifecycle(id, ...)`, in exactly that order.

For creation, create the row first because no ID exists yet, then call `runLifecycle(monitor.id, ...)` to publish and apply its local state.

For `setActive`, wrap Prisma update, publish, and `applyMonitorStateUnlocked` in the ID queue. Return `{ monitor, runner }`.

For `delete`, wrap all work in the ID queue and order it:

1. `prisma.monitor.delete`;
2. `removeRunner`;
3. fire-and-forget `publish('delete', ...)`;
4. return the deleted row.

Do not await `publish`; its implementation absorbs Redis errors, and database success must not be rolled back by Redis availability.

Update `reconcileUnlocked` to call `applyMonitorStateUnlocked` after its database lookup.

Change `restartWithWorkspaceId` to return `Promise<void>` and reconcile each matching runner by ID through public `reconcile`, awaiting `Promise.all`. Update any caller to explicitly discard or await the returned Promise according to its existing API behavior.

In the async workspace-settings mutation at `src/server/trpc/routers/workspace.ts`, await the restart:

```ts
await monitorManager.restartWithWorkspaceId(workspaceId);
```

### Step 4: Run manager tests and confirm GREEN

Run:

```bash
pnpm --dir src/server exec vitest run model/monitor/manager.spec.ts
```

Expected: all manager tests pass, including mutation/reconciliation overlap.

### Step 5: Commit Task 2

```bash
git add src/server/model/monitor/manager.ts src/server/model/monitor/manager.spec.ts src/server/trpc/routers/workspace.ts
git diff --cached --check
git commit -m "fix(monitor): preserve lifecycle mutation ordering"
```

---

## Task 3: Add bounded subscription readiness, recovery, and Redis cleanup

**Files:**

- Modify: `src/server/model/monitor/broadcast.spec.ts`
- Modify: `src/server/model/monitor/broadcast.ts`

### Step 1: Extend the fake client and add failing lifecycle tests

Add `quit`, connection event emission, and deferred subscription control to `FakeRedisClient`:

```ts
quit = vi.fn(async () => 'OK');

emit(event: string, ...args: unknown[]) {
  this.listeners.get(event)?.forEach((listener) => listener(...args));
}
```

Convert existing `start` tests to `async` and await `start(handler, recovery, timeout)`.

Use fake timers only in timeout/retry tests, restoring real timers in `afterEach`. Add tests for:

- no Redis URL resolves `true` immediately and constructs no clients;
- successful initial subscription resolves `true` and does not call recovery;
- an unresolved subscription resolves `false` after the supplied startup timeout;
- failed initial subscription retries after a later `ready` event;
- first successful subscription after startup timeout calls recovery once;
- `close` followed by `ready` neither subscribes nor recovers;
- reconnect (`close`, then `ready`) resubscribes and calls recovery;
- `close()` awaits `quit()` on both publisher and subscriber;
- `publish()` after close does nothing.

Use this concrete late-subscription sequence:

```ts
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
```

Use this concrete shutdown assertion:

```ts
test('close quits both clients and disables later activity', async () => {
  const { broadcast, publisher, subscriber } = createHarness();
  const recovery = vi.fn(async () => undefined);
  await broadcast.start(vi.fn(), recovery, 50);

  await broadcast.close();
  subscriber.emit('ready');
  await broadcast.publish('stop', 'workspace-a', 'monitor-a');

  expect(publisher.quit).toHaveBeenCalledOnce();
  expect(subscriber.quit).toHaveBeenCalledOnce();
  expect(subscriber.subscribe).toHaveBeenCalledOnce();
  expect(publisher.publish).not.toHaveBeenCalled();
  expect(recovery).not.toHaveBeenCalled();
});
```

### Step 2: Run broadcast tests and confirm RED

Run:

```bash
pnpm --dir src/server exec vitest run model/monitor/broadcast.spec.ts
```

Expected: `start` has no readiness result/recovery parameters, reconnect is unsupported, and clients cannot be closed.

### Step 3: Implement the subscription state machine

Extend `RedisClient` with:

```ts
quit(): Promise<unknown>;
```

Change the public API to:

```ts
async start(
  handler: MonitorBroadcastHandler,
  recover: () => void | Promise<void>,
  readinessTimeoutMs = 5_000
): Promise<boolean>

async close(): Promise<void>
```

Add state fields:

```ts
private subscribed = false;
private subscribing?: Promise<void>;
private closed = false;
private startupWaitFinished = false;
private hasSubscribed = false;
private retryTimer?: ReturnType<typeof setTimeout>;
private recover?: () => void | Promise<void>;
```

Implement a private `ensureSubscribed()` that:

1. exits when closed, no subscriber, already subscribed, or a subscribe attempt exists;
2. calls `subscribe`;
3. on success marks subscribed and resolves the first-ready Promise;
4. calls recovery when `startupWaitFinished` is already true or `hasSubscribed` was already true;
5. catches and logs subscription errors;
6. clears the in-flight marker in `finally`;
7. schedules one unref'd retry after 1 second if still open and unsubscribed.

Install subscriber listeners:

- `ready`: call `ensureSubscribed`;
- `close` and `end`: set `subscribed = false`;
- `message`: retain schema validation and self-message filtering, then invoke the handler with rejected-Promise logging.

`start` creates clients once, begins `ensureSubscribed`, then races the first-ready Promise against the configurable timeout. Set `startupWaitFinished = true` after the race settles. Without a Redis URL, return `true` without clients or timers. If synchronous initialization fails, log it and return `false`.

Recovery runs fire-and-forget with its own rejection logging. It must never make subscription readiness fail.

`close` must:

1. set `closed = true`;
2. set `subscribed = false`;
3. clear the retry timer;
4. detach the publisher/subscriber fields before awaiting cleanup so later publishes no-op;
5. `await Promise.allSettled([publisher?.quit(), subscriber?.quit()])`;
6. log rejected cleanup results without throwing.

Guard `publish` with `closed || !publisher`.

### Step 4: Run broadcast tests and confirm GREEN

Run:

```bash
pnpm --dir src/server exec vitest run model/monitor/broadcast.spec.ts
```

Expected: all broadcast tests pass with no leaked fake timers.

### Step 5: Commit Task 3

```bash
git add src/server/model/monitor/broadcast.ts src/server/model/monitor/broadcast.spec.ts
git diff --cached --check
git commit -m "fix(monitor): recover redis lifecycle subscriptions"
```

---

## Task 4: Wire ordered startup and graceful shutdown

**Files:**

- Modify: `src/server/main.ts`

### Step 1: Implement ordered startup

Replace the fire-and-forget calls with:

```ts
await monitorBroadcast.start(
  (event) => monitorManager.handleBroadcast(event),
  () => monitorManager.reconcileAll()
);
await monitorManager.startAll();
```

This ensures the server does not listen until the initial Redis readiness bound and database reconciliation finish. A late first subscription or reconnect calls `reconcileAll`; the per-Monitor queue prevents it from racing unsafely with startup.

### Step 2: Await Redis cleanup during shutdown

Before flushing batch writers, add:

```ts
await monitorBroadcast.close();
```

Keep HTTP close first so new requests stop before distributed lifecycle transport shuts down.

### Step 3: Run focused Monitor tests

Run:

```bash
pnpm --dir src/server exec vitest run model/monitor/manager.spec.ts model/monitor/broadcast.spec.ts
```

Expected: all focused tests pass.

### Step 4: Run server and repository verification

Run:

```bash
pnpm check:type
pnpm build
```

Expected: both commands exit successfully. If either exposes a pre-existing unrelated failure, record the exact command and error and do not alter unrelated files.

### Step 5: Review the final diff

Run:

```bash
git status --short
git diff --check
git diff --stat 65547b4b..HEAD
git log --oneline --decorate -8
```

Confirm:

- only Monitor manager, Redis broadcast, startup wiring, tests, and approved docs changed;
- no locale JSON or Prisma schema changed;
- no Redis client is created without `REDIS_URL`;
- all remote actions reconcile PostgreSQL state;
- same-ID lifecycle operations use one queue;
- successful database writes publish before local runner application;
- failed delete preserves the runner;
- shutdown closes both Redis clients.

### Step 6: Commit startup wiring

```bash
git add src/server/main.ts
git diff --cached --check
git commit -m "fix(monitor): await lifecycle sync startup"
```

### Step 7: Final verification after commits

Run:

```bash
pnpm --dir src/server exec vitest run model/monitor/manager.spec.ts model/monitor/broadcast.spec.ts
pnpm check:type
pnpm build
git status --short
```

Expected: tests, type checks, and build pass; the worktree is clean.
