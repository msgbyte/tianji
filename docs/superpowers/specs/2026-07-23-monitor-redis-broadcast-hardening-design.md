# Monitor Redis Broadcast Hardening Design

## Goal

Make optional Redis Monitor lifecycle synchronization safe under concurrent events, startup races, Redis disconnects, and database failures.

This supplements `2026-07-21-monitor-redis-broadcast-design.md`. Redis remains optional and PostgreSQL remains authoritative.

## Scope

The hardening covers:

- per-Monitor lifecycle serialization;
- stale and out-of-order broadcast handling;
- initial Redis subscription readiness;
- recovery after late connection or reconnect;
- deletion failure consistency;
- Redis connection shutdown;
- concurrency and recovery tests.

No client behavior, database schema, translation files, notification semantics, or provider cancellation behavior changes.

## Per-Monitor Lifecycle Serialization

`MonitorManager` will maintain an internal Promise tail for each `monitorId`. Every lifecycle transition for an existing Monitor must run through this queue:

- local update;
- local active-state change;
- local deletion;
- remote lifecycle event;
- startup reconciliation;
- reconnect reconciliation.

Different Monitor IDs may run concurrently. Operations for the same Monitor ID run in submission order. A rejected operation must not poison the queue; later transitions must still execute. Queue entries are removed after their last operation settles.

New Monitor creation cannot enter a Monitor-specific queue until PostgreSQL assigns its ID. After creation, applying local runner state and publishing the create action use the assigned ID.

Runner replacement is atomic from the lifecycle queue’s perspective: stop the referenced old runner, load required workspace state, assign the new runner, and start it before allowing the next transition. This prevents overwritten runners from retaining live timers.

## PostgreSQL-Authoritative Reconciliation

All remote actions use one reconciliation path, including `stop` and `delete`.

Within the Monitor queue, reconciliation loads the current Monitor and notifications from PostgreSQL:

- If the Monitor exists and `active=true`, replace the local runner with one built from current database state.
- If the Monitor is inactive or missing, stop and remove the local runner.

The action remains in the Redis message for observability, but it does not directly determine final runner state. This prevents a delayed stop message from overriding a newer `active=true` database state.

## Local Mutation Ordering

### Update and active-state changes

Database mutation happens inside the Monitor queue. Once PostgreSQL succeeds:

1. publish the lifecycle action even if applying local runner state later fails;
2. reconcile the local runner from the returned/current database state;
3. return or surface the local reconciliation error to the caller.

Publishing remains fire-and-forget from the API caller’s perspective and absorbs Redis failures. Publishing after the committed database mutation allows healthy remote nodes to synchronize even if the handling node cannot rebuild its runner.

### Delete

Deletion order becomes:

1. delete the PostgreSQL row;
2. stop and remove the local runner;
3. publish `delete`.

If PostgreSQL deletion fails, the local runner remains registered and running, and nothing is published.

## Full Reconciliation

`MonitorManager.reconcileAll()` repairs process-local state after startup and Redis recovery.

It loads active Monitor IDs from PostgreSQL and unions them with locally registered runner IDs. Each ID is then submitted to its Monitor lifecycle queue and reconciled against current PostgreSQL state. This both starts missing active runners and removes runners whose Monitor became inactive or was deleted while messages were unavailable.

Startup uses this path instead of independently creating runners from a potentially stale snapshot.

## Redis Subscription Lifecycle

`MonitorBroadcast.start()` becomes asynchronous and reports whether the first subscription became ready within a bounded startup window.

- Without `REDIS_URL`, it resolves immediately without creating clients.
- With Redis, it creates publisher and subscriber clients, installs listeners, and attempts subscription.
- Server startup waits up to 5 seconds for the first successful subscription, then continues even if Redis is unavailable.
- Subscription failure is logged but does not permanently disable retry.
- A later Redis `ready` event attempts subscription again when not currently subscribed.
- `close`/disconnect marks the subscriber unavailable.
- Every successful subscription after startup initialization invokes a recovery callback.

The main startup sequence is:

1. begin Redis subscription and wait for readiness or the 5-second bound;
2. run and await `monitorManager.reconcileAll()`;
3. mark Monitor state initialized;
4. accept HTTP traffic.

If the first successful subscription occurs after the startup bound, or Redis reconnects later, the recovery callback runs `reconcileAll()` to repair messages lost while unsubscribed.

Redis Pub/Sub remains non-durable; reconciliation, rather than replay, provides recovery.

## Shutdown

`MonitorBroadcast.close()` closes publisher and subscriber with `quit()` using settled cleanup so one failed close does not prevent the other. It disables further subscription attempts and publishing.

Graceful server shutdown awaits this cleanup before exiting.

## Error Handling

- Invalid and self-originated messages remain ignored.
- Redis initialization, subscription, handler, recovery, publish, and close failures are logged.
- Redis failures never roll back successful PostgreSQL mutations.
- A lifecycle queue continues after an operation rejects.
- Recovery reconciliation failures are logged and retried on the next recovery opportunity or process restart.

## Testing

Tests will prove:

- two overlapping reconciliations for one Monitor never leave two running runners;
- different Monitor IDs are not globally serialized;
- a delayed stop message preserves a newer `active=true` database state;
- a queue continues after a failed operation;
- startup reconciliation removes stale runners and starts missing active runners;
- delete failure preserves the existing runner and emits no broadcast;
- database success still publishes when local runner reconciliation fails;
- startup waits for subscription readiness only up to the configured bound;
- initial subscription failure can recover on a later ready event;
- late first subscription and reconnect invoke recovery reconciliation;
- `close()` quits both Redis clients and prevents later activity;
- no Redis URL still constructs no clients and adds no startup delay.

Focused Vitest tests, server and root type checks, and the production build remain required verification.

## Non-goals

- Durable Redis Streams or message replay.
- Database polling while Redis is absent.
- Cross-process cancellation of an in-flight provider request.
- Globally ordering mutations across different Monitor IDs.
- Changing the existing distributed execution lock.
