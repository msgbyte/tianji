# Monitor Redis Broadcast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize Monitor runner creation, updates, active state, and deletion across Tianji server instances when `REDIS_URL` is configured.

**Architecture:** Add a Monitor-specific optional Redis Pub/Sub transport backed by `ioredis`. Keep PostgreSQL authoritative: remote create, update, and start messages reconcile from the database, while stop and delete immediately remove the local runner. Centralize lifecycle mutations in `MonitorManager` so API and cron paths publish consistently.

**Tech Stack:** TypeScript, Node.js 22+, ioredis 5, Prisma, Vitest 3

## Global Constraints

- Enable broadcasting only when `env.cache.redisUrl` is present.
- Without Redis, do not create Redis clients and preserve local behavior.
- Log Redis failures without rejecting successful PostgreSQL mutations.
- Send identifiers through Redis, never Monitor payloads.
- Do not check database state before every Monitor execution.
- Do not cancel an in-flight provider execution.
- Do not modify JSON files under `src/client/public/locales`.

---

### Task 1: Optional Monitor Redis transport

**Files:**
- Create: `src/server/model/monitor/broadcast.ts`
- Create: `src/server/model/monitor/broadcast.spec.ts`

**Interfaces:**
- Produces `MonitorBroadcastAction`, `MonitorBroadcastEvent`, `MonitorBroadcast`, and `monitorBroadcast`.
- `start(handler)` subscribes only when a Redis URL exists.
- `publish(action, workspaceId, monitorId)` publishes a source-tagged event and absorbs Redis errors.

- [ ] **Step 1: Write the failing transport tests**

Create a fake Redis client and injectable factory. Add these tests:

```ts
test('does not construct redis clients without a redis url', () => {
  const createClient = vi.fn();
  const broadcast = new MonitorBroadcast(undefined, 'instance-a', createClient);
  broadcast.start(vi.fn());
  expect(createClient).not.toHaveBeenCalled();
});

test('delivers valid messages from another instance', () => {
  const { broadcast, subscriber } = createHarness('instance-a');
  const handler = vi.fn();
  broadcast.start(handler);
  subscriber.emitMessage({
    action: 'stop',
    workspaceId: 'workspace-a',
    monitorId: 'monitor-a',
    sourceInstanceId: 'instance-b',
  });
  expect(handler).toHaveBeenCalledWith(expect.objectContaining({ action: 'stop' }));
});

test('ignores messages from the same instance', () => {
  const { broadcast, subscriber } = createHarness('instance-a');
  const handler = vi.fn();
  broadcast.start(handler);
  subscriber.emitMessage({
    action: 'stop',
    workspaceId: 'workspace-a',
    monitorId: 'monitor-a',
    sourceInstanceId: 'instance-a',
  });
  expect(handler).not.toHaveBeenCalled();
});

test('ignores malformed messages', () => {
  const { broadcast, subscriber } = createHarness('instance-a');
  const handler = vi.fn();
  broadcast.start(handler);
  subscriber.emitRaw('{');
  subscriber.emitRaw(JSON.stringify({ action: 'stop' }));
  expect(handler).not.toHaveBeenCalled();
});

test('publishes the current instance id', async () => {
  const { broadcast, publisher } = createHarness('instance-a');
  broadcast.start(vi.fn());
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

test('absorbs publish failures', async () => {
  const { broadcast, publisher } = createHarness('instance-a');
  broadcast.start(vi.fn());
  publisher.publish.mockRejectedValue(new Error('redis unavailable'));
  await expect(
    broadcast.publish('stop', 'workspace-a', 'monitor-a')
  ).resolves.toBeUndefined();
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```bash
pnpm --dir src/server test:ci -- model/monitor/broadcast.spec.ts
```

Expected: FAIL because `broadcast.ts` does not exist.

- [ ] **Step 3: Implement the minimal transport**

Create the event contract:

```ts
export const MONITOR_BROADCAST_CHANNEL = 'tianji:monitor:lifecycle';
export type MonitorBroadcastAction =
  | 'create'
  | 'update'
  | 'start'
  | 'stop'
  | 'delete';

export interface MonitorBroadcastEvent {
  action: MonitorBroadcastAction;
  workspaceId: string;
  monitorId: string;
  sourceInstanceId: string;
}
```

Implement `MonitorBroadcast` with constructor injection for Redis URL, instance ID, and client factory. Parse messages through Zod, ignore other channels, invalid messages, and self-originated messages. Attach Redis `error` listeners. Invoke async handlers with `.catch(logger.error)` so they cannot create unhandled rejections. `start()` initiates subscription without blocking startup. `publish()` is a no-op without initialized Redis and catches failures.

Create the singleton using `env.cache.redisUrl`, `nanoid()`, and `new Redis(url)`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Step 2 command. Expected: all transport tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/model/monitor/broadcast.ts src/server/model/monitor/broadcast.spec.ts
git commit -m "feat(monitor): add optional redis broadcast transport"
```

---

### Task 2: Reconcile MonitorManager lifecycle

**Files:**
- Modify: `src/server/model/monitor/manager.ts`
- Create: `src/server/model/monitor/manager.spec.ts`

**Interfaces:**
- Consumes `monitorBroadcast` and `MonitorBroadcastEvent`.
- Produces `removeRunner`, `reconcile`, `handleBroadcast`, and `setActive`.

- [ ] **Step 1: Write failing manager tests**

Mock Prisma, `MonitorRunner`, and `monitorBroadcast`, then cover:

```ts
test('remote start reloads active monitor state and starts a runner', async () => {
  prisma.monitor.findUnique.mockResolvedValue(activeMonitor);
  await manager.handleBroadcast(remoteEvent('start'));
  expect(prisma.monitor.findUnique).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'monitor-a', workspaceId: 'workspace-a' },
    include: { notifications: true },
  }));
  expect(createdRunner.startMonitor).toHaveBeenCalledOnce();
});

test('remote update stops the old runner and starts a fresh runner', async () => {
  const oldRunner = seedRunner(manager, 'monitor-a');
  prisma.monitor.findUnique.mockResolvedValue(activeMonitor);
  await manager.handleBroadcast(remoteEvent('update'));
  expect(oldRunner.stopMonitor).toHaveBeenCalledOnce();
  expect(createdRunner.startMonitor).toHaveBeenCalledOnce();
});

test.each(['stop', 'delete'] as const)(
  'remote %s stops and removes its runner',
  async (action) => {
    const runner = seedRunner(manager, 'monitor-a');
    await manager.handleBroadcast(remoteEvent(action));
    expect(runner.stopMonitor).toHaveBeenCalledOnce();
    expect(manager.getRunner('monitor-a')).toBeUndefined();
  }
);

test('inactive reconciliation removes the runner without starting one', async () => {
  const runner = seedRunner(manager, 'monitor-a');
  prisma.monitor.findUnique.mockResolvedValue({ ...activeMonitor, active: false });
  await manager.handleBroadcast(remoteEvent('start'));
  expect(runner.stopMonitor).toHaveBeenCalledOnce();
  expect(createdRunner.startMonitor).not.toHaveBeenCalled();
});

test('successful create publishes create', async () => {
  prisma.monitor.create.mockResolvedValue(activeMonitor);
  await manager.upsert(createInput);
  expect(monitorBroadcast.publish).toHaveBeenCalledWith(
    'create', 'workspace-a', 'monitor-a'
  );
});

test('successful update publishes update', async () => {
  prisma.monitor.update.mockResolvedValue(activeMonitor);
  await manager.upsert({ ...createInput, id: 'monitor-a' });
  expect(monitorBroadcast.publish).toHaveBeenCalledWith(
    'update', 'workspace-a', 'monitor-a'
  );
});
test.each([[true, 'start'], [false, 'stop']] as const)(
  'setActive maps %s to %s',
  async (active, action) => {
    prisma.monitor.update.mockResolvedValue({ ...activeMonitor, active });
    await manager.setActive('workspace-a', 'monitor-a', active);
    expect(monitorBroadcast.publish).toHaveBeenCalledWith(
      action, 'workspace-a', 'monitor-a'
    );
  }
);

test('delete publishes only after successful database deletion', async () => {
  seedRunner(manager, 'monitor-a');
  prisma.monitor.delete.mockResolvedValue(activeMonitor);
  await manager.delete('workspace-a', 'monitor-a');
  expect(monitorBroadcast.publish).toHaveBeenCalledWith(
    'delete', 'workspace-a', 'monitor-a'
  );
});

```

- [ ] **Step 2: Run manager tests and verify RED**

```bash
pnpm --dir src/server test:ci -- model/monitor/manager.spec.ts
```

Expected: FAIL because the new lifecycle APIs and publishing are absent.

- [ ] **Step 3: Implement runner removal and reconciliation**

Add:

```ts
removeRunner(monitorId: string): void {
  this.monitorRunner[monitorId]?.stopMonitor();
  delete this.monitorRunner[monitorId];
  this.updateRunnerMetric();
}

async reconcile(workspaceId: string, monitorId: string): Promise<void> {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId, workspaceId },
    include: { notifications: true },
  });
  if (!monitor?.active) {
    this.removeRunner(monitorId);
    return;
  }
  const runner = await this.createRunner(monitor);
  await runner.startMonitor();
}

async handleBroadcast(event: MonitorBroadcastEvent): Promise<void> {
  if (event.action === 'stop' || event.action === 'delete') {
    this.removeRunner(event.monitorId);
    return;
  }
  await this.reconcile(event.workspaceId, event.monitorId);
}
```

Extract runner-count metric updates so creation and removal both set the current count.

- [ ] **Step 4: Publish local create, update, active, and delete mutations**

In `upsert()`, identify `create` versus `update`, complete the database and local runner work, then fire-and-forget `monitorBroadcast.publish(action, workspaceId, monitor.id)`.

Add:

```ts
async setActive(workspaceId: string, monitorId: string, active: boolean) {
  const monitor = await prisma.monitor.update({
    where: { workspaceId, id: monitorId },
    data: { active },
    include: { notifications: true },
  });
  let runner = this.getRunner(monitorId);
  if (active) {
    runner = await this.createRunner(monitor);
    await runner.startMonitor();
  } else {
    this.removeRunner(monitorId);
  }
  void monitorBroadcast.publish(active ? 'start' : 'stop', workspaceId, monitorId);
  return { monitor, runner };
}
```

Make `delete()` stop/remove locally, await Prisma deletion, and only then publish `delete`.

- [ ] **Step 5: Run manager tests and verify GREEN**

Run the Step 2 command. Expected: all manager tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/server/model/monitor/manager.ts src/server/model/monitor/manager.spec.ts
git commit -m "feat(monitor): synchronize runner lifecycle events"
```

---

### Task 3: Route active-state callers through MonitorManager

**Files:**
- Modify: `src/server/trpc/routers/monitor.ts`
- Modify: `src/server/cronjob/daily.ts`
- Modify: `src/server/cronjob/daily.spec.ts`

**Interfaces:**
- Consumes `monitorManager.setActive(workspaceId, monitorId, active)`.
- Preserves existing manual and automatic Monitor event and audit text.

- [ ] **Step 1: Add a failing automatic-disable test**

```ts
test('uses synchronized stop when automatically disabling a monitor', async () => {
  vi.spyOn(prisma, '$queryRaw').mockResolvedValue([
    { id: 'monitor-a', name: 'API', workspaceId: 'workspace-a' },
  ]);
  const setActive = vi.spyOn(monitorManager, 'setActive').mockResolvedValue({
    monitor: inactiveMonitor,
    runner: undefined,
  });
  await autoDisableContinuousDownMonitorDaily();
  expect(setActive).toHaveBeenCalledWith('workspace-a', 'monitor-a', false);
});
```

- [ ] **Step 2: Run cron tests and verify RED**

```bash
pnpm --dir src/server test:ci -- cronjob/daily.spec.ts
```

Expected: FAIL because automatic disable directly updates Prisma and only stops the local runner.

- [ ] **Step 3: Use setActive from the manual API**

Replace the database update and runner start/stop block with:

```ts
const { monitor } = await monitorManager.setActive(
  workspaceId,
  monitorId,
  active
);
```

Write the existing manual UP/DOWN event through Prisma and preserve the audit text. Await the event and audit operations where their APIs return promises.

- [ ] **Step 4: Use setActive from automatic disable**

Replace the direct update and local stop with:

```ts
await monitorManager.setActive(candidate.workspaceId, candidate.id, false);
```

Keep the existing automatic-disable event and logging.

- [ ] **Step 5: Run focused tests and verify GREEN**

```bash
pnpm --dir src/server test:ci -- model/monitor/broadcast.spec.ts model/monitor/manager.spec.ts cronjob/daily.spec.ts
```

Expected: all focused tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/server/trpc/routers/monitor.ts src/server/cronjob/daily.ts src/server/cronjob/daily.spec.ts
git commit -m "fix(monitor): broadcast active state changes"
```

---

### Task 4: Initialize and verify

**Files:**
- Modify: `src/server/main.ts`

**Interfaces:**
- Consumes `monitorBroadcast.start(handler)` and `monitorManager.handleBroadcast(event)`.

- [ ] **Step 1: Initialize before starting Monitor runners**

```ts
monitorBroadcast.start((event) => monitorManager.handleBroadcast(event));
monitorManager.startAll();
```

- [ ] **Step 2: Format and inspect the scoped diff**

```bash
pnpm prettier --write src/server/model/monitor/broadcast.ts src/server/model/monitor/broadcast.spec.ts src/server/model/monitor/manager.ts src/server/model/monitor/manager.spec.ts src/server/trpc/routers/monitor.ts src/server/cronjob/daily.ts src/server/cronjob/daily.spec.ts src/server/main.ts
git diff --check
git status --short
```

Expected: no whitespace errors and no locale JSON changes.

- [ ] **Step 3: Run focused tests**

```bash
pnpm --dir src/server test:ci -- model/monitor/broadcast.spec.ts model/monitor/manager.spec.ts cronjob/daily.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run server and repository checks**

```bash
pnpm --dir src/server check:type
pnpm check:type
pnpm build
```

Expected: all commands PASS. Record any unrelated baseline failure by its first failing file.

- [ ] **Step 5: Commit startup wiring**

```bash
git add src/server/main.ts
git diff --cached --check
git diff --cached --name-only
git commit -m "feat(monitor): initialize redis lifecycle sync"
```

- [ ] **Step 6: Verify final repository state**

```bash
git status --short
git log -6 --oneline
```

Expected: a clean worktree and all Monitor broadcast commits at the tip of `master`.
