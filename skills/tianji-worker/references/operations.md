# Common Worker operations

## Contents

- [Connect and inspect](#connect-and-inspect)
- [Dashboard tRPC fallback](#dashboard-trpc-fallback)
- [Create, pull, and deploy](#create-pull-and-deploy)
- [Test drafts and execute saved code](#test-drafts-and-execute-saved-code)
- [Read logs and troubleshoot](#read-logs-and-troubleshoot)
- [Manage environment variables](#manage-environment-variables)
- [Configure schedules](#configure-schedules)
- [Review and roll back revisions](#review-and-roll-back-revisions)
- [Pause, resume, and delete](#pause-resume-and-delete)

## Connect and inspect

Self-hosted servers require `ENABLE_FUNCTION_WORKER=true` and a server restart. Select the intended workspace in the dashboard. Start at `/worker`; creation is `/worker/add`, details `/worker/{workerId}`, and editing `/worker/{workerId}/edit` or `/worker/{workerId}/editor`.

For OpenAPI, use an API key whose user has the required workspace permissions. Obtain credentials through the user's existing secure configuration; do not paste or print them. The following shell examples assume `TIANJI_SERVER_URL`, `TIANJI_WORKSPACE_ID`, and `TIANJI_API_KEY` are already set. `TIANJI_SERVER_URL` is the instance URL without the `/open` suffix. These variables are conventions for the examples, not CLI configuration.

Before operating on the target, retrieve its live OpenAPI document:

```bash
curl --fail-with-body --silent --show-error \
  "${TIANJI_SERVER_URL%/}/open/_document"
```

1. Confirm a successful response containing an OpenAPI JSON object with `openapi` and `paths`, not an HTML login page or error payload. This document is served only when the instance enables OpenAPI. If it is unavailable or invalid, report the discovery failure and do not issue guessed management API requests. Local code work or supported dashboard actions can continue; direct tRPC still needs the separate version check below.
2. Find the requested operation using tags, summaries, or operation IDs. Inspect its HTTP method, path, path/query parameters, request body, responses, and security requirements. Resolve referenced schemas (`$ref`), including required fields, defaults, types, enums, and nullability. Absence from `paths` means no exported operation was found; it does not prove the dashboard lacks the feature.
3. Resolve the document's `servers` URL against the target instance, then append the operation path. Tianji normally declares `/open`; do not add it twice. Keep authenticated requests on the intended instance. Substitute actual workspace/resource IDs and serialize parameters/body according to the live schema.
4. Treat the target document as authoritative for exported routes and parameters. The examples and field names below describe this skill's maintained version, not a substitute contract for another deployment. Reuse the document within the same task and target; fetch again after switching instances, an upgrade, or a schema-related request failure. Never retry a mutation blindly.

Use the discovered list and detail operations to inspect the Worker. Record its current name, description, code, active state, cron settings, and revisions. A missing Worker can return `null`; confirm it exists before updating. Read saved variables and module bindings through exported operations when available, otherwise through the maintained dashboard fallback. A basic Worker detail response does not necessarily include that configuration.

OpenAPI describes the wire contract, not all update semantics. Keep the preservation requirements below even when a field is optional. If the target's replacement/preservation semantics are unknown, its schema cannot express a safe update, or it conflicts with the maintained behavior below, check that version's implementation or use its supported dashboard action before changing data. Do not infer equivalent behavior from similar field names or treat an optional field as proof that omission preserves its saved value.

## Dashboard tRPC fallback

Check the target OpenAPI document first: if it exports the needed operation, use that contract. The following procedures are dashboard fallbacks for operations not exported in the version used to maintain this skill. **They are not synchronized by `/open/_document`.** Maintain their names, inputs, and behavior separately against `src/server/trpc/routers/worker.ts` and the matching dashboard callers for the deployed version.

All inputs below include `workspaceId`:

| Operation | tRPC procedure | Additional input |
| --------- | -------------- | ---------------- |
| Test draft | `worker.testCode` (mutation) | `code`; optional `workerId`, `payload`, `environmentVariables`, `moduleBindings` |
| Run saved code | `worker.execute` (mutation) | `workerId`; optional `payload` |
| Read execution history/logs | `worker.getExecutions` (query) | `workerId`; optional `page` (starts at 1), `pageSize` (default 20, max 100) |
| Read saved variables | `worker.getEnvironmentVariables` (query) | `workerId` |
| Read pinned modules | `worker.getModuleBindings` (query) | `workerId` |

Use the authenticated dashboard when possible. A direct tRPC call requires verifying the deployed procedure, input schema, authentication, and client transport/serialization; this table is not a REST URL template. Do not invent `/open` routes or CLI commands for these operations. If neither a supported API nor dashboard access is available, report the exact missing capability/access and the next dashboard step.

## Create, pull, and deploy

### Dashboard

Use **Add Worker**, enter its name and code, configure variables, test with representative payloads, then save with the intended active state. Use plain JavaScript in the dashboard unless the server enables `ENABLE_FUNCTION_WORKER_TYPESCRIPT_SUPPORT=true`. Local CLI projects compile TypeScript into a bundle.

### CLI

Check the installed CLI before use:

```bash
tianji --help
tianji worker --help
tianji login
tianji worker init my-worker
cd my-worker
npm install
npm run build
```

If the CLI is unavailable, build it from the Tianji repository using its documented prerequisites (Node.js 22.14+ and pnpm):

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install
pnpm --dir packages/cli build
cd packages/cli
pnpm link --global
```

Login is the top-level `tianji login`, not `tianji worker login`. It saves server URL, workspace ID, and API key in `~/.config/tianji/config.json`. Do not print that file. A project's `.tianjirc` stores its Worker ID/name; inspect it before pulling or deploying to confirm the target.

- `tianji worker pull <worker-id>` downloads deployed **compiled JavaScript** into `src/index.ts`; it does not recover original source files or dependencies. Use a clean directory or review local changes first. If the generated template already contains that file, inspect it before rerunning with `--overwrite`; that flag discards the existing file. Check `.tianjirc` after a failed pull, since initialization may already have changed it.
- `tianji worker deploy` runs `npm run build`, reads `dist/index.js`, and creates or updates the Worker. It sends `active: true` and omits cron fields. **It activates the Worker and the server defaults disable/clear its cron configuration.** Use the dashboard or a complete `upsert` body when preserving an existing Worker's active/cron settings matters. There are no CLI test, run, logs, cron, or rollback commands in this version.

### OpenAPI upsert

Find the create/update operation in the target document (called `upsert` in this skill's maintained version). Build a JSON file containing the intended code and settings, validate it against that operation's request schema, and submit it using the discovered method and URL, with the required authentication and content type.

Illustrative body for an existing scheduled Worker: confirm field names against the target schema and replace every example value from the current record. In particular, keep `active: false` if the Worker is paused.

```json
{
  "id": "existing-worker-id",
  "name": "Daily summary",
  "description": "Send the daily summary",
  "code": "export default { async fetch(payload, context) { return { ok: true }; } };",
  "active": true,
  "enableCron": true,
  "cronExpression": "0 9 * * *"
}
```

For creation, omit `id`; `name` and `code` must be nonempty in the maintained schema. For updates, **upsert is not a partial patch**: the maintained implementation defaults missing `active` to `true`, missing `enableCron` to `false`, and missing/empty `cronExpression` to `null`. Always carry forward active and cron settings unless changing them intentionally; do not rely on optional fields retaining saved values. In this schema, represent an existing null cron expression by omitting it or sending `""`, not JSON `null`; check the target's nullability before serialization.

The maintained `description` input also accepts a string, not JSON `null`: omit it when the current description is null unless the target schema specifies otherwise. Worker, variable, module, and revision IDs in these examples are placeholders; use the actual IDs returned by Tianji.

In the maintained implementation, omitting `environmentVariables` preserves saved variables; providing it replaces the entire collection. Omitted `moduleBindings` are resolved from the source while retaining existing pins for used imports. When explicitly providing bindings, each needs `moduleId`, `moduleRevisionId`, and an `importAlias` starting with `@shared/`. Inspect available modules at `/worker/modules`; do not invent module or revision IDs. See the runtime reference for import behavior.

Only change `ownerId` as requested; owner reassignment requires owner/admin permissions. A property in a response is not necessarily writable: for example, the maintained Worker response includes `visibility` but its upsert input does not. Check the target's request schema and permissions before promising an access change.

After saving, GET info again and compare the intended fields, including active and cron state.

## Test drafts and execute saved code

### Draft test

Open the edit form and use **Test Code**, or the code editor's preview. Supply a JSON payload and inspect **Test Result**, return value, and logs. Test at least a valid input, an invalid input, and any important external-service error path.

For API testing, use a draft-test operation if the target document exports one; otherwise follow the `worker.testCode` fallback above. An existing `workerId` allows saved variables/bindings to be resolved. Without it, supply required draft configuration.

Omit `environmentVariables` to test with all saved values, including Secrets. Supplying a draft array replaces that collection for the test only; keep existing Secret IDs with no `value` to reuse them. Omitted `moduleBindings` are resolved from the draft's imports while preserving existing pins for used aliases. No test configuration is saved.

Tests use `context.type === 'test'` and isolated KV; they do not save draft code or create normal execution-history records. **Outbound `request` calls still reach real services.** Use test credentials/endpoints or a payload-controlled dry run when appropriate, and preserve the intended production behavior.

### Manual execution

Use a manual-execution operation exported by the target, or the run action on the Worker detail/editor page (`worker.execute` fallback). This executes **saved code** with `context.type === 'manual'` and records an execution. Manual execution can run an inactive Worker; pausing does not block an authorized manual run.

### Public HTTP execution

An active, Public Worker accepts HTTP requests at the application route below. This is separate from management OpenAPI and does not require the management API key; never send that key to the Worker.

```bash
curl --fail-with-body --silent --show-error \
  -H 'Content-Type: application/json' \
  --data '{"message":"example"}' \
  "${TIANJI_SERVER_URL%/}/api/worker/${TIANJI_WORKSPACE_ID}/${WORKER_ID}"
```

Query parameters and object body fields are merged into `payload`, with the body winning conflicts. Query values remain strings. The context type is `http`, with request method, URL, and headers available in `context.request`. Validate inputs and implement application authentication when needed; do not assume the public trigger is protected by the management API key.

Check the response content and corresponding execution record. An HTTP 200 by itself does not prove Worker success.

## Read logs and troubleshoot

Open the Worker's **Executions** tab, find the relevant timestamp/trigger, and open its detail panel to inspect status, result/error, logs, duration, and resource usage. **Statistics** provides aggregate behavior; it cannot prove a particular run succeeded. Draft test logs appear in the test result instead of this history.

For API access, use an execution-history operation exported by the target, or the maintained `worker.getExecutions` fallback. Check the selected interface's pagination contract. The maintained CLI has no logs command.

| Symptom                                      | Check                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| Worker feature missing                       | Server feature flag and restart; selected workspace                    |
| 401/403 on management calls                  | Server URL, key/workspace match, actor ownership/permissions           |
| Public invocation fails                      | Correct IDs, `active`, visibility, response body, execution error      |
| Missing environment value                    | Exact key, Text/Secret setup, saved versus draft configuration         |
| `fetch`, `process`, or Node APIs unavailable | Use sandbox `request`, `context.env`, and documented globals           |
| Schedule stopped after CLI deploy            | Re-read `enableCron` and `cronExpression`; restore intended settings   |
| Test passes but live run fails               | Trigger type, HTTP-only context, actual payload, environment, KV scope |
| KV errors or missing state                   | Runtime limits/TTL; test isolation; KV is temporary storage            |

If the needed UI or authenticated session is unavailable, explain the exact missing access and next dashboard step. Do not substitute an invented API route.

## Manage environment variables

Use **Environment Variables** in the edit form. Text values are readable; saved Secrets expose only their identity and whether a value exists. Runtime code reads both through `context.env.KEY`. Never log/return Secrets or replace them with redaction placeholders.

Read variables through an operation exported by the target, or the maintained `worker.getEnvironmentVariables` fallback. Do not replace the collection without its complete current list; use the dashboard if needed.

For an intentional API update, include `environmentVariables` in a complete upsert body:

```json
[
  { "id": "existing-text-id", "key": "REGION", "type": "Text", "value": "eu" },
  { "id": "existing-secret-id", "key": "API_TOKEN", "type": "Secret" },
  { "key": "NEW_SETTING", "type": "Text", "value": "enabled" }
]
```

In the maintained implementation, this array is a **complete replacement**: retain every unrelated row and ID. An empty array deletes all variables. Omit the entire field to preserve the collection. Existing Secrets are preserved by keeping their `id`, key, and `type: "Secret"` while omitting `value`. Sending an empty string changes the Secret to an empty string. Verify these semantics for a different target version before updating. New or rotated Secrets need a real `value`, supplied through secure input rather than chat, shell history, or committed files.

Keys must be unique and satisfy the target input schema (the maintained version uses `^[A-Za-z_][A-Za-z0-9_]*$`, up to 255 characters). Test the relevant behavior after saving without revealing the values.

## Configure schedules

Use the edit form to enable cron and preview its next runs. Set all of `active: true`, `enableCron: true`, and a valid `cronExpression`; keep other settings unchanged in API upserts. Schedules must run no more often than once per minute. Expressions use the workspace timezone, falling back to UTC; check that timezone before interpreting a time such as `0 9 * * *`.

Scheduled runs receive an empty payload and `context.type === 'cron'`. Code must not assume HTTP request context or mandatory HTTP payload fields. Verify the next scheduled execution in history; a successful manual run alone does not verify scheduling.

To disable only scheduling, set `enableCron: false` while explicitly preserving `active` and the desired expression. To pause HTTP and cron together, use the active endpoint below.

## Review and roll back revisions

Use **Revisions** to compare code and select a revision, or discover the revision-list and rollback operations in the target document. Use the chosen record's **`id`**, not its display revision number, in the rollback request (`revisionId` in the maintained schema). Confirm the method, URL, and body against the target before submitting.

Rollback restores code and pinned shared-module bindings. It preserves current name, description, active state, cron configuration, and environment variables; it is **not a configuration rollback**. Code/binding changes create a new revision; configuration-only edits do not. Verify current code/settings afterward, then test behavior using the current environment.

## Pause, resume, and delete

Find the active-state operation in the target document, or use the dashboard control. The maintained `toggleActive` operation sets the supplied value explicitly: `active: false` pauses and `active: true` resumes. Confirm the target method, path, and request schema before calling it.

This preserves cron fields. Inactive Workers reject public HTTP triggers and do not run on cron; authorized manual execution remains possible. Re-read info to verify the state.

For explicitly requested permanent removal, first retain any code/configuration the user needs, then use the dashboard delete action or the deletion operation discovered in the target document. This requires workspace admin permissions. Use pausing when the request is only to stop normal triggers; deleting is not necessary. After deletion, verify the Worker no longer appears in the list.
