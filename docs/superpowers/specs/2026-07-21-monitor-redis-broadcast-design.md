# Monitor Redis Broadcast Design

## Goal

Keep Monitor runners synchronized across Tianji server instances when Redis is configured, while preserving the current behavior and dependencies for deployments without Redis.

## Scope

The synchronization covers Monitor creation, configuration updates, manual start, manual stop, automatic stop, and deletion. It synchronizes server-side `MonitorRunner` lifecycle only; it does not add a new client-facing WebSocket event or change Monitor UI behavior.

No files under `src/client/public/locales` will be modified.

## Architecture

Add a Monitor-specific Redis Pub/Sub component under `src/server/model/monitor`. It owns dedicated `ioredis` publisher and subscriber connections and uses a fixed Monitor control channel. It is separate from the Socket.IO Redis adapter because Monitor scheduling is a server concern and must not depend on WebSocket initialization.

The component is enabled only when `env.cache.redisUrl` is present. With no Redis URL, initialization and publishing are no-ops and no Redis client is created.

Each server process has a unique instance ID. Every published message contains:

- `action`: `create`, `update`, `start`, `stop`, or `delete`
- `workspaceId`
- `monitorId`
- `sourceInstanceId`

Subscribers validate incoming JSON and ignore messages emitted by their own instance. Invalid messages and Redis errors are logged without terminating the server.

## Data Flow

### Startup

Server startup initializes the Monitor broadcast subscriber before accepting requests. Initialization remains non-fatal: if Redis is configured but unavailable, Tianji logs the failure and continues running with local Monitor behavior.

Every instance still calls `monitorManager.startAll()` and loads active Monitors from PostgreSQL. The existing distributed execution lock remains responsible for avoiding overlapping executions; the new broadcast layer is responsible only for synchronizing runner lifecycle.

### Create and update

After the database write and local runner update succeed, the handling instance publishes `create` or `update`.

Receiving instances treat PostgreSQL as authoritative. They load the Monitor and its notifications by `workspaceId` and `monitorId`, stop any existing local runner, and create a runner using the current database state. An active Monitor is started; an inactive Monitor is left without a running runner.

The message does not include Monitor configuration, preventing stale or sensitive payload data from being copied through Redis.

### Start

After setting `active=true` and starting the local runner, the handling instance publishes `start`. Receiving instances reload the Monitor from PostgreSQL and start a runner from the current configuration.

### Stop

After setting `active=false` and stopping the local runner, the handling instance publishes `stop`. Receiving instances immediately stop and remove their local runner without waiting for the next interval.

The daily automatic-disable path publishes the same `stop` action after updating PostgreSQL.

An execution already inside its provider is not force-cancelled. Stopping prevents its runner from scheduling another execution, matching the existing `stopMonitor()` contract.

### Delete

After deletion succeeds, the handling instance publishes `delete`. Receiving instances stop and remove their local runner. They do not query the deleted database row.

## Failure Handling

PostgreSQL remains the source of truth. A Redis connection, subscription, or publish failure is logged but does not roll back or reject a successful Monitor mutation.

The broadcast layer reconnects according to `ioredis` defaults. A message missed while an instance is disconnected is not replayed. On process restart, `startAll()` reconciles that instance with the current `active` values in PostgreSQL.

This design does not add a database check before every Monitor execution. Real-time synchronization is provided only when Redis is configured, as requested.

## Testing

Focused server tests will verify:

- no Redis clients are constructed when no Redis URL is configured;
- valid remote messages are delivered to the lifecycle handler;
- messages from the current instance are ignored;
- malformed messages do not reach the handler;
- create, update, and start reload authoritative database state and start the correct local runner;
- stop and delete stop and remove the local runner;
- local create, update, start, stop, automatic stop, and delete publish the expected action;
- publish failures do not fail successful database mutations.

Focused Vitest tests, server type checking, and the repository build will be used for verification.

## Non-goals

- Supporting real-time multi-instance Monitor synchronization without Redis.
- Replacing the existing Monitor execution lock.
- Cancelling an in-flight provider request.
- Adding durable event replay or delivery acknowledgements.
- Changing client-visible Monitor events, notification semantics, or translations.
