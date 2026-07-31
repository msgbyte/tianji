# Worker Cron Lifecycle Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize Worker cron schedules and captured Worker code across Tianji server instances through an optional Worker-specific Redis lifecycle broadcast.

**Architecture:** Add a `WorkerCronBroadcast` parallel to `MonitorBroadcast`. PostgreSQL remains authoritative: every local mutation persists first and every remote event reloads the complete Worker row before replacing or removing the process-local runner. `WorkerCronManager` serializes lifecycle work per Worker ID and performs full reconciliation at startup and Redis recovery.

**Tech Stack:** TypeScript 5.7, Node.js 22.14.0+, Prisma 5, ioredis 5, Zod 4, Vitest 3, pnpm 9.7.1

## Global Constraints

- Use Redis channel `tianji:worker:cron:lifecycle`.
- Enable broadcasting only when `env.cache.redisUrl` is present.
- Keep PostgreSQL authoritative; Redis events contain identifiers and action metadata only.
- Log Redis failures without rejecting successful PostgreSQL mutations.
- Preserve single-instance and Redis-disabled behavior.
- Do not refactor or modify Monitor broadcast behavior.
- Do not modify JSON files under `src/client/public/locales`.
- Redis Pub/Sub remains best-effort; durable delivery and periodic reconciliation are out of scope.

---

### Task 1: Worker-specific Redis lifecycle transport

**Files:**
- Create: `src/server/model/worker/broadcast.spec.ts`
- Create: `src/server/model/worker/broadcast.ts`

**Interfaces:**
- Produces `WORKER_CRON_BROADCAST_CHANNEL`.
- Produces `WorkerCronBroadcastAction = 'create' | 'update' | 'start' | 'stop' | 'delete'`.
- Produces `WorkerCronBroadcastEvent` with `workspaceId`, `workerId`, and `sourceInstanceId`.
- Produces `WorkerCronBroadcast.start(handler, recover, readinessTimeoutMs?)`, `publish(action, workspaceId, workerId)`, and `close()`.
- Produces singleton `workerCronBroadcast`.

- [ ] **Step 1: Write failing transport tests**

Create a fake Redis client with real listener registration and observable
`subscribe`, `publish`, and `quit` methods. Add tests that exercise:

```ts
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

test('ignores self-originated and malformed messages', async () => {
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
```

Also cover successful initial subscription without recovery, reconnect recovery,
subscription timeout, retry after `ready`, concurrent `start`, concurrent
`close`, ignored activity after `close`, and absorbed subscription, handler,
publish, recovery, and cleanup errors. These are the existing
`MonitorBroadcast` transport contracts applied to the independent Worker
channel and event schema.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm --dir src/server exec vitest run model/worker/broadcast.spec.ts
```

Expected: FAIL because `model/worker/broadcast.ts` does not exist.

- [ ] **Step 3: Implement the minimal Worker transport**

Create the Worker event contract:

```ts
export const WORKER_CRON_BROADCAST_CHANNEL =
  'tianji:worker:cron:lifecycle';

export type WorkerCronBroadcastAction =
  | 'create'
  | 'update'
  | 'start'
  | 'stop'
  | 'delete';

export interface WorkerCronBroadcastEvent {
  action: WorkerCronBroadcastAction;
  workspaceId: string;
  workerId: string;
  sourceInstanceId: string;
}
```

Implement `WorkerCronBroadcast` with the same optional-client, readiness,
reconnect recovery, validation, self-filtering, error isolation, and idempotent
shutdown behavior as `MonitorBroadcast`, but use only the Worker channel and
Worker event schema. Construct the singleton with:

```ts
export const workerCronBroadcast = new WorkerCronBroadcast(
  env.cache.redisUrl,
  nanoid(),
  (url) => new Redis(url)
);
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Step 2 command. Expected: all Worker transport tests PASS.

- [ ] **Step 5: Commit the transport**

```bash
git add src/server/model/worker/broadcast.ts \
  src/server/model/worker/broadcast.spec.ts
git commit -m "feat(worker): add cron lifecycle broadcast"
```

---

### Task 2: Database-authoritative Worker runner reconciliation

**Files:**
- Create: `src/server/model/worker/cronManager.spec.ts`
- Modify: `src/server/model/worker/cronManager.ts`

**Interfaces:**
- Consumes `workerCronBroadcast` and `WorkerCronBroadcastEvent`.
- Produces `reconcile(workspaceId, workerId): Promise<void>`.
- Produces `reconcileAll(): Promise<void>`.
- Produces `handleBroadcast(event): Promise<void>`.
- Local `upsert` and `delete` serialize through the same per-Worker queue.

- [ ] **Step 1: Write failing stale-runner and concurrency tests**

Mock only Prisma, `WorkerCronRunner`, cache invalidation, and the external
broadcast boundary. The fake runner must retain the complete Worker fixture so
the test observes the stale-code bug through the real manager behavior.

Use Worker fixtures whose relevant fields differ:

```ts
const oldWorker = {
  ...activeWorker,
  code: 'return "old";',
  cronExpression: '*/5 * * * *',
  revision: 1,
};

const updatedWorker = {
  ...activeWorker,
  code: 'return "new";',
  cronExpression: '*/30 * * * *',
  revision: 2,
};
```

Add the primary regression test:

```ts
test('remote update replaces stale cron expression and worker code', async () => {
  const manager = new WorkerCronManager();
  const oldRunner = seedRunner(manager, oldWorker);
  mocks.prisma.functionWorker.findUnique.mockResolvedValue(updatedWorker);

  await manager.handleBroadcast(remoteEvent('update'));

  expect(oldRunner.stopCron).toHaveBeenCalledOnce();
  expect(mocks.runnerInstances).toHaveLength(2);
  expect(mocks.runnerInstances[1].worker.cronExpression)
    .toBe('*/30 * * * *');
  expect(mocks.runnerInstances[1].worker.code).toBe('return "new";');
  expect(mocks.runnerInstances[1].startCron).toHaveBeenCalledOnce();
  expect(manager.getRunner('worker-a')).toBe(mocks.runnerInstances[1]);
});
```

Add reconciliation behavior:

```ts
test.each([
  null,
  { ...updatedWorker, active: false },
  { ...updatedWorker, enableCron: false },
  { ...updatedWorker, cronExpression: null },
])('remote event removes a runner for non-runnable state %#', async (state) => {
  const manager = new WorkerCronManager();
  const oldRunner = seedRunner(manager, oldWorker);
  mocks.prisma.functionWorker.findUnique.mockResolvedValue(state);

  await manager.handleBroadcast(remoteEvent('delete'));

  expect(oldRunner.stopCron).toHaveBeenCalledOnce();
  expect(manager.getRunner('worker-a')).toBeUndefined();
});
```

Add tests proving:

- Same-Worker reconciliations serialize, while different Workers do not.
- A rejected operation does not poison the Worker queue.
- `reconcileAll()` starts a missing active cron runner and stops a stale local
  runner absent from the runnable database set.
- Successful create and update publish only after PostgreSQL succeeds.
- Successful deletion stops the local runner and publishes `delete` only after
  PostgreSQL succeeds.
- Failed deletion preserves the local runner and does not publish.

- [ ] **Step 2: Run manager tests and verify RED**

Run:

```bash
pnpm --dir src/server exec vitest run model/worker/cronManager.spec.ts
```

Expected: FAIL because `handleBroadcast`, `reconcile`, `reconcileAll`, queueing,
and publishing do not exist.

- [ ] **Step 3: Add the per-Worker lifecycle queue**

Add:

```ts
private lifecycleTails = new Map<string, Promise<void>>();

private runLifecycle<T>(
  workerId: string,
  operation: () => Promise<T>
): Promise<T> {
  const previous = this.lifecycleTails.get(workerId) ?? Promise.resolve();
  const result = previous.catch(() => undefined).then(operation);
  const tail = result.then(
    () => undefined,
    () => undefined
  );
  this.lifecycleTails.set(workerId, tail);

  return result.finally(() => {
    if (this.lifecycleTails.get(workerId) === tail) {
      this.lifecycleTails.delete(workerId);
    }
  });
}
```

Wrap update, delete, and remote reconciliation with this queue. After a create
returns its generated ID, use the same queue to publish and apply local state.

- [ ] **Step 4: Implement authoritative reconciliation**

Add an unqueued lookup and state application:

```ts
private async reconcileUnlocked(
  workspaceId: string,
  workerId: string
): Promise<void> {
  const worker = await prisma.functionWorker.findUnique({
    where: { id: workerId, workspaceId },
  });

  if (
    !worker?.active ||
    !worker.enableCron ||
    !worker.cronExpression
  ) {
    await this.removeRunner(workerId);
    return;
  }

  await this.applyWorkerStateUnlocked(worker);
}

async reconcile(workspaceId: string, workerId: string): Promise<void> {
  return this.runLifecycle(workerId, () =>
    this.reconcileUnlocked(workspaceId, workerId)
  );
}

async handleBroadcast(event: WorkerCronBroadcastEvent): Promise<void> {
  await this.reconcile(event.workspaceId, event.workerId);
}
```

`removeRunner` must stop and delete an existing runner. `applyWorkerStateUnlocked`
must remove non-runnable state, otherwise create a fresh runner and start it.
Resolve the workspace before stopping the current runner so a failed workspace
lookup preserves the valid old runner.

- [ ] **Step 5: Implement full reconciliation and startup reuse**

`reconcileAll()` must query runnable Workers with:

```ts
{
  where: {
    active: true,
    enableCron: true,
    cronExpression: { not: null },
  },
  select: { id: true, workspaceId: true },
}
```

Union those IDs with current runner IDs, then call `reconcile` for every item.
Log one Worker failure without preventing other Workers from reconciling.
Change `startAll()` to await `reconcileAll()`, set `isStarted` back to `false`
if it rejects, and log the resulting runner count.

- [ ] **Step 6: Publish committed local lifecycle changes**

For local creation use `create`; for any existing Worker upsert use `update`;
for deletion use `delete`. Invoke:

```ts
void workerCronBroadcast.publish(action, workspaceId, worker.id);
```

only after the corresponding PostgreSQL operation succeeds. Apply the exact
persisted row locally through `applyWorkerStateUnlocked`, inside the same
per-Worker queue.

- [ ] **Step 7: Run focused Worker manager tests and verify GREEN**

Run the Step 2 command. Expected: all Worker manager tests PASS.

- [ ] **Step 8: Run Worker model regression tests**

Run:

```bash
pnpm --dir src/server exec vitest run \
  model/worker/broadcast.spec.ts \
  model/worker/cronManager.spec.ts \
  model/worker/index.spec.ts
```

Expected: PASS.

- [ ] **Step 9: Commit manager reconciliation**

```bash
git add src/server/model/worker/cronManager.ts \
  src/server/model/worker/cronManager.spec.ts
git commit -m "fix(worker): reconcile cron runners across instances"
```

---

### Task 3: Server lifecycle integration and final verification

**Files:**
- Modify: `src/server/main.ts`

**Interfaces:**
- Consumes `workerCronBroadcast`.
- Starts Worker subscription with `workerCronManager.handleBroadcast`.
- Uses `workerCronManager.reconcileAll` for Redis recovery.
- Closes Worker transport during graceful shutdown.

- [ ] **Step 1: Wire Worker broadcast before Worker runner startup**

Import `workerCronBroadcast`. In `startServer()`, inside the
`env.enableFunctionWorker` branch, use:

```ts
await workerCronBroadcast.start(
  (event) => workerCronManager.handleBroadcast(event),
  () => workerCronManager.reconcileAll()
);
if (isShuttingDown) {
  return;
}

await workerCronManager.startAll();
if (isShuttingDown) {
  return;
}
```

Await `startAll()` so HTTP listening does not race initial Worker
reconciliation.

- [ ] **Step 2: Close the Worker transport**

During graceful shutdown, close both lifecycle transports:

```ts
await Promise.all([
  monitorBroadcast.close(),
  workerCronBroadcast.close(),
]);
```

The Worker singleton is safe to close even when Worker functionality or Redis
is disabled.

- [ ] **Step 3: Run focused lifecycle tests**

Run:

```bash
pnpm --dir src/server exec vitest run \
  model/worker/broadcast.spec.ts \
  model/worker/cronManager.spec.ts \
  model/worker/index.spec.ts \
  model/monitor/broadcast.spec.ts \
  model/monitor/manager.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run CI-equivalent static verification**

Run:

```bash
pnpm check:type
pnpm build
git diff --check
```

Expected: all commands exit successfully. If an unrelated pre-existing failure
appears, record the exact command and failure separately from focused test
results.

- [ ] **Step 5: Commit lifecycle wiring**

```bash
git add src/server/main.ts
git commit -m "feat(worker): wire cron lifecycle synchronization"
```

- [ ] **Step 6: Review final branch scope**

Run:

```bash
git status --short
git log --oneline master..HEAD
git diff --stat master...HEAD
```

Confirm only the approved design, implementation plan, Worker lifecycle files,
tests, and server wiring are present.
