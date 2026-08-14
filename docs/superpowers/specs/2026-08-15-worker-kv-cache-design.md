# Worker KV Cache

## Problem

Tianji Function Workers are isolated executions. They cannot currently retain
short-lived state between HTTP, manual, and cron invocations, or share
short-lived state with another Worker in the same Workspace.

Tianji already has a shared Keyv cache manager. It uses Redis when `REDIS_URL`
is configured, PostgreSQL otherwise, and an in-process map in memory-only
deployments. Workers should reuse this capability without receiving direct
access to Keyv or to Tianji's internal cache keys.

## Goals

- Expose a small asynchronous KV cache API inside Function Workers.
- Make the current Worker the safe default scope.
- Allow explicit sharing between Workers in the same Workspace.
- Preserve the existing Redis, PostgreSQL, and memory-only backend selection.
- Bound cache lifetime, payload size, operation count, and backend latency.
- Keep tenant identity and physical key construction outside the sandbox.
- Make the API available consistently to HTTP, manual, cron, and code-test
  executions.

## Non-goals

- Durable or permanent Worker storage.
- Transactions, compare-and-swap, atomic increments, or cross-key consistency.
- Listing keys, clearing a namespace, or providing a cache management UI.
- Per-Workspace storage accounting or a new Worker KV database table.
- Exposing raw Keyv, Redis, or PostgreSQL clients to Worker code.
- Extending the VM2 runtime, which is not used by the current Worker execution
  path.

## Alternatives Considered

### Separate Worker and Workspace APIs

Expose `kv` for the current Worker and `kv.workspace` for explicit Workspace
sharing. This is the selected approach because private access is the shortest
and safest call, while shared access remains conspicuous during code review.

### Scope Option on Every Operation

An API such as `kv.get(key, { scope: 'workspace' })` has fewer surface objects,
but dynamic scope values are easier to pass accidentally and make shared access
less obvious.

### Dedicated Worker KV Table

A dedicated table could support quotas, administration, and richer queries, but
it would duplicate Tianji's existing cache backend and introduce durable-storage
semantics that are outside this feature.

## Worker API

The Worker editor and sandbox expose the following interface:

```ts
type KVValue =
  | null
  | string
  | number
  | boolean
  | KVValue[]
  | { [key: string]: KVValue };

interface KVScope {
  get<T extends KVValue = KVValue>(key: string): Promise<T | undefined>;
  set(key: string, value: KVValue, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
}

declare const kv: KVScope & {
  workspace: KVScope;
};
```

Examples:

```ts
await kv.set('last-result', result);
const previous = await kv.get('last-result');

await kv.workspace.set('shared-token', token, 60_000);
const sharedToken = await kv.workspace.get('shared-token');
```

`kv.*` operates on the current Worker. `kv.workspace.*` operates on a namespace
shared by all Workers in the current Workspace. Worker code cannot supply or
override either identity.

## Architecture

Add a Worker-specific KV facade outside the isolate. The facade receives a
trusted execution scope containing the Workspace ID, Worker ID, execution type,
and test namespace where applicable. It validates every operation, constructs a
logical key, and delegates to the existing `getCacheManager()`.

Logical keys use versioned namespaces:

```text
worker-kv:v1:<workspaceId>:<workerId>:<userKey>
workspace-kv:v1:<workspaceId>:<userKey>
```

The existing Keyv namespace remains responsible for the final physical prefix.
The facade never exposes constructed keys, backend clients, or backend errors to
the sandbox.

The facade is injected into `runCodeInIVM()` as a host object. Its methods use
the existing isolated-vm reference bridge and return only transferable plain
values. The Worker editor's sandbox declaration is updated so the API has type
checking and completion.

## Data and TTL Semantics

- The default TTL is 10 minutes.
- An explicit TTL is expressed in milliseconds.
- The minimum TTL is 1 second and the maximum TTL is 1 day.
- A missing or expired entry returns `undefined`.
- Keys must be non-empty strings no longer than 256 characters.
- Values must be JSON-compatible plain data and encode to at most 256 KiB.
- Numbers must be finite.
- `undefined`, functions, symbols, bigints, binary values, class instances, and
  cyclic data are rejected.
- Serialized UTF-8 JSON size is used for the value and write-budget checks.

Concurrent writes to one key use last-write-wins semantics. No read-modify-write
atomicity is promised.

## Execution Scopes

HTTP, manual, and cron execution pass the persisted Worker's Workspace ID and
Worker ID to the facade. All three entry points therefore observe the same
private and Workspace-shared cache entries.

Code-test execution uses an unguessable, per-execution test namespace for both
API levels. A test can verify `set`, `get`, and `delete` within one execution,
but it cannot read or mutate live Worker or Workspace cache entries. Test keys
remain subject to the normal TTL and are not promised to be available to a
later test execution.

Updating or rolling back a Worker preserves its cache because the Worker ID is
unchanged. Deleting a Worker does not scan the backend for its private keys;
those entries become unreadable according to their TTL, which is at most one
day. Workspace entries are not tied to the lifecycle of any one Worker.

## Resource Limits

Each Worker execution has one shared budget across private and Workspace
operations:

- At most 50 KV API calls.
- At most 1 MiB of cumulative serialized writes.
- At most 256 KiB per value.
- At most 2 seconds waiting for each backend operation.

Rejected validation and budget checks count as calls but do not reach the
backend. These limits reduce accidental loops and storage amplification while
keeping the first version backend-neutral. They are not a substitute for route
rate limiting or durable per-Workspace quotas.

## Failure Semantics

Invalid keys, values, TTLs, exhausted budgets, backend failures, and operation
timeouts reject the Worker API call. A backend failure is never converted into
a cache miss because callers may use the cache for idempotency or duplicate
suppression. Worker code can explicitly catch an error when best-effort cache
behavior is appropriate.

Errors returned to the isolate are stable and sanitized. They identify the
operation category without including physical keys, cached values, database
details, Redis URLs, hostnames, or credentials. Server logs likewise avoid
values and secret-bearing connection details.

As with other remote stores, timing out the caller cannot guarantee that an
already-issued backend write was cancelled. Callers must not treat a timeout as
proof that a write did not occur.

## Security Boundaries

- Workspace and Worker identity come only from the server's persisted Worker
  lookup or cron runner, never from the request payload or Worker code.
- Namespace construction happens outside the sandbox.
- Worker code cannot access Tianji query caches, cron state, distributed locks,
  or another Workspace's keys.
- A public Worker can access its Workspace cache only when its trusted saved
  code calls `kv.workspace`; an external caller cannot select a scope directly.
- User-controlled keys and values remain bounded and are never written to logs.

## Tests and Verification

Add focused tests covering:

- Private and Workspace logical key construction.
- Isolation across Workers and across Workspaces.
- Default TTL, the 1-second minimum, and the 1-day maximum.
- Key, JSON value, finite-number, per-value, operation-count, and cumulative
  write validations.
- Missing entries, deletion results, and last-write-wins behavior.
- Sanitized backend failure and timeout errors.
- `kv` and `kv.workspace` calls across the isolated-vm bridge.
- Correct identity propagation for HTTP, manual, and cron execution.
- Per-execution test namespaces that cannot access live cache entries.
- Editor sandbox declarations matching the runtime API.

Run the focused server and VM Vitest suites first, then run `pnpm check:type`
and `pnpm build` as required by the contributor guide. Do not modify locale JSON
files.
