# Worker Cron Lifecycle Synchronization

## Problem

Each Tianji server instance owns an in-memory `WorkerCronManager` and its own
`WorkerCronRunner` objects. Updating a worker currently replaces the runner only
on the instance that handled the request. Other instances keep both the old cron
expression and the old worker code captured by their existing runner.

The distributed execution lock prevents concurrent executions of the same
worker, but it does not invalidate stale runners. A stale instance can therefore
continue scheduling at the old interval and execute old code whenever it
acquires the lock.

## Goals

- Propagate worker lifecycle changes to every server instance when Redis is
  configured.
- Reload the complete worker record so cron configuration and executable code
  change together.
- Keep PostgreSQL as the authoritative state and Redis as an optional
  invalidation signal.
- Cover create, update, activation, deactivation, deletion, and code rollback.
- Preserve the current single-instance and Redis-disabled behavior.

## Non-goals

- Durable event delivery or an outbox.
- Refactoring the existing Monitor broadcast into a generic abstraction.
- Changing worker execution locking or cron expression validation.
- Modifying client translation files.

## Architecture

Add a Worker-specific `WorkerCronBroadcast`, modeled after
`MonitorBroadcast`, with its own Redis channel:

```text
tianji:worker:cron:lifecycle
```

Events contain only lifecycle metadata:

```ts
{
  action: 'create' | 'update' | 'start' | 'stop' | 'delete';
  workspaceId: string;
  workerId: string;
  sourceInstanceId: string;
}
```

Worker data and code are never sent through Redis. The receiving instance uses
the identifiers to reload the current row from PostgreSQL.

`WorkerCronManager` serializes lifecycle work per worker. Local mutations and
remote reconciliation for the same worker share the same promise-tail queue,
while different workers can reconcile concurrently.

## Data Flow

For a local mutation:

1. Persist the worker mutation in PostgreSQL.
2. Invalidate the local worker query cache.
3. Publish a lifecycle event without making Redis availability a prerequisite
   for the database mutation.
4. Apply the persisted worker state to the local runner.

For a remote event:

1. Ignore events emitted by the current process.
2. Serialize reconciliation by worker ID.
3. Reload the worker from PostgreSQL using both workspace and worker IDs.
4. Remove the local runner when the worker is missing, inactive, cron-disabled,
   or has no cron expression.
5. Otherwise stop the old runner, create a runner from the fresh worker and
   workspace records, and start it.

This replacement refreshes the cron expression, worker code, revision, and
other captured worker fields as one unit.

## Startup, Recovery, and Shutdown

- Start the Worker broadcast subscription before starting Worker cron runners.
- Run `reconcileAll()` at Worker manager startup instead of only adding active
  database rows.
- Run `reconcileAll()` after the Redis subscriber reconnects so missed changes
  during a disconnection converge.
- Close the Worker broadcast during graceful shutdown alongside the Monitor
  broadcast.
- When Redis is not configured, the broadcast creates no Redis clients and
  Worker cron startup continues normally.

## Failure Semantics

Redis Pub/Sub remains best-effort, matching the existing Monitor design. A
publish failure is logged but does not roll back a successful PostgreSQL
mutation. Startup and reconnect reconciliation repair changes missed while an
instance was disconnected, but a message lost while a subscriber remains
connected can leave that instance stale until its next reconciliation or
restart. Periodic reconciliation or durable delivery is intentionally outside
this change.

Malformed events are ignored. Handler, subscription, publishing, recovery, and
cleanup failures are logged without crashing the server.

## Tests

Add focused tests proving:

- A remote update reloads PostgreSQL state and replaces a runner containing an
  old cron expression and old code.
- A remote stop or delete removes and stops the stale local runner.
- Full reconciliation adds missing active cron runners and removes stale or
  disabled runners.
- Same-worker lifecycle operations are serialized.
- The Worker broadcast ignores self-originated and malformed events, recovers
  after subscription, remains optional without Redis, and publishes the
  expected event shape.

Run the focused Worker and broadcast tests first, followed by server type
checking and the repository build required by the contributor guide.
