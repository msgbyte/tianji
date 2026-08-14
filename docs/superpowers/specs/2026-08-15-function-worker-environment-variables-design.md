# Function Worker Environment Variables Design

## Goal

Add per-worker environment variables that are available to Function Worker code through `context.env`. Variables have one of two management visibility types:

- `Text`: management APIs and the UI may read and write the value.
- `Secret`: management APIs and the UI may write or replace the value, but must never return the stored value.

This secrecy boundary applies to configuration management. Worker code must receive secret values to use them and can therefore intentionally copy them into execution output, logs, or outbound requests.

## Data Model

Create a `FunctionWorkerEnvironmentVariable` model related to `FunctionWorker` with cascade deletion. Each row contains:

- `id`
- `workerId`
- `key`
- `type`, using a `FunctionWorkerEnvironmentVariableType` enum with `Text` and `Secret`
- `value`
- creation and update timestamps

Add a unique constraint on `(workerId, key)` and an index on `workerId`. Keys must match `[A-Za-z_][A-Za-z0-9_]*` and be unique within a worker.

The value is stored in the database using the same server-readable storage model as existing Tianji API credentials. Encryption at rest and key rotation are outside this change.

## API Contract

Worker create and update inputs accept an environment-variable collection so worker configuration and variables can be persisted atomically.

Read responses use an explicit safe DTO instead of returning Prisma environment-variable rows:

- A Text item returns `id`, `key`, `type`, and `value`.
- A Secret item returns `id`, `key`, `type`, and `hasValue`; it has no `value` property.

For an existing Secret item, an omitted replacement value preserves the stored value. A supplied value replaces it. Creating a Secret requires a value. Changing a variable's type requires a new value so a stored Secret can never become readable through a type-only update.

Removing an existing item from the submitted collection deletes it. All reads and writes remain scoped through the worker's `workspaceId`, and only workspace administrators may modify variables.

The existing worker list and detail responses continue returning worker data without joined environment-variable rows. A dedicated workspace-scoped query returns the safe environment-variable DTOs needed by the edit UI.

## UI

Add an Environment Variables section to the existing Worker edit form. Users can add rows, edit keys and Text values, choose Text or Secret, replace Secret values, and remove rows.

Text values are populated when editing. Existing Secret rows display an empty password input with a clear indication that a value is already configured and that leaving the field empty preserves it. The old Secret value is never placed in client state or DOM attributes.

Creation and edit submission use the same form contract. Existing project UI primitives and translation helpers are reused. No JSON files under `src/client/public/locales` are modified.

## Runtime Data Flow

Immediately before each stored worker execution, the server loads that worker's current environment-variable rows and builds a plain key/value map. It merges that map into the existing execution context:

```ts
async function fetch(payload, context) {
  return context.env.API_URL;
}
```

Manual and Cron executions use the same environment loader so saved changes take effect without recreating a Cron runner. Code testing accepts draft environment-variable values during worker creation and uses saved values for an existing worker, while applying any explicit draft replacements.

The environment map is passed only into the isolated VM invocation. It is not added to execution records, audit logs, metrics labels, or server logs by the environment-variable implementation.

## Validation and Error Handling

- Reject invalid or duplicate keys before writing.
- Reject a new Secret without a value.
- Reject type changes without a new value.
- Treat an omitted existing Secret value as "preserve", not as an empty-string overwrite.
- Keep worker configuration and environment-variable writes in one transaction so partial updates are not visible.
- Preserve existing workspace authorization and "worker not found" behavior.

## Testing

Use test-driven development for the following behavior:

- Safe DTO serialization returns Text values and never includes a Secret value.
- Creating and replacing Secret values writes the submitted value without returning it.
- Omitting an existing Secret replacement preserves the stored value.
- Type changes without a replacement value fail.
- Invalid and duplicate keys fail.
- Manual and Cron executions receive current values at `context.env`.
- Test-code execution receives the intended draft or saved environment.
- The edit UI populates Text values, never populates Secret values, and sends replacements only when entered.

Run focused Vitest suites while iterating, followed by the repository's `pnpm check:type` and `pnpm build` CI-equivalent checks. Report any unrelated baseline failures separately.

## Out of Scope

- Encryption at rest or secret-key rotation.
- Preventing authorized Worker code from intentionally exposing a Secret.
- Workspace-wide shared variables.
- Revision history for environment-variable values.
- Changes to generated locale JSON files.
