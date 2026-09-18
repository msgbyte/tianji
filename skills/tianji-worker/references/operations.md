# Common Worker operations

## Contents

- [Connect and inspect](#connect-and-inspect)
- [Create, pull, and deploy](#create-pull-and-deploy)
- [Test drafts and execute saved code](#test-drafts-and-execute-saved-code)
- [Read logs and troubleshoot](#read-logs-and-troubleshoot)
- [Manage environment variables](#manage-environment-variables)
- [Configure schedules](#configure-schedules)
- [Review and roll back revisions](#review-and-roll-back-revisions)
- [Pause, resume, and delete](#pause-resume-and-delete)

## Connect and inspect

Self-hosted servers require `ENABLE_FUNCTION_WORKER=true` and a server restart. Select the intended workspace in the dashboard. Start at `/worker`; creation is `/worker/add`, details `/worker/{workerId}`, and editing `/worker/{workerId}/edit` or `/worker/{workerId}/editor`.

For OpenAPI, use an API key for that workspace with the required permissions. Obtain credentials through the user's existing secure configuration; do not paste or print them. The following shell examples assume `TIANJI_SERVER_URL`, `TIANJI_WORKSPACE_ID`, and `TIANJI_API_KEY` are already set. These variables are conventions for the examples, not CLI configuration.

```bash
WORKER_API="${TIANJI_SERVER_URL%/}/open/workspace/${TIANJI_WORKSPACE_ID}/worker"
curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer $TIANJI_API_KEY" "$WORKER_API/all"

# Set WORKER_ID to the actual ID returned above, not its display name.
curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer $TIANJI_API_KEY" "$WORKER_API/$WORKER_ID/info"
```

Record the current `name`, `description`, `code`, `active`, `enableCron`, and `cronExpression`. A missing Worker can return `null`. Confirm the target exists before updating it. Inspect saved variables and module bindings in the dashboard when relevant; the public info response does not replace those views.

The currently supported management routes, relative to `WORKER_API`, are:

| Method | Path                       | Input                                  |
| ------ | -------------------------- | -------------------------------------- |
| GET    | `/all`                     | None                                   |
| GET    | `/{workerId}/info`         | None                                   |
| POST   | `/upsert`                  | Worker body described below            |
| PATCH  | `/{workerId}/toggleActive` | `{"active": false}` or `true`          |
| DELETE | `/{workerId}/delete`       | None; workspace admin required         |
| GET    | `/{workerId}/revisions`    | None                                   |
| POST   | `/{workerId}/rollback`     | `{"revisionId": "actual-revision-id"}` |

Do not infer additional `/open` routes from dashboard actions. Tests, manual execution, execution history, variable reads, and binding reads currently have no exported OpenAPI route.

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

Build a JSON file containing the intended code and settings, then submit it:

```bash
curl --fail-with-body --silent --show-error \
  -X POST -H "Authorization: Bearer $TIANJI_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @worker-update.json "$WORKER_API/upsert"
```

Example body for an existing scheduled Worker (replace every example value from the current record):

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

For creation, omit `id`; `name` and `code` must be nonempty. For updates, **upsert is not a partial patch**: missing `active` defaults to `true`, missing `enableCron` defaults to `false`, and missing/empty `cronExpression` becomes `null`. Always carry forward all three fields unless changing them intentionally. Represent an existing null cron expression by omitting it or sending `""`, not JSON `null`.

`description` also accepts a string, not JSON `null`: omit it when the current description is null. Worker, variable, module, and revision IDs in these examples are placeholders; use the actual IDs returned by Tianji.

Omitting `environmentVariables` preserves saved variables; providing it replaces the entire collection. Omitted `moduleBindings` are resolved from the source while retaining existing pins for used imports. When explicitly providing bindings, each needs `moduleId`, `moduleRevisionId`, and an `importAlias` starting with `@shared/`. Inspect available modules at `/worker/modules`; do not invent module or revision IDs. See the runtime reference for import behavior.

Only change `ownerId` as requested; owner reassignment requires owner/admin permissions. `visibility` appears in Worker records but is **not accepted by the current upsert input**. Do not assume a `visibility` property changes access; verify support in the target server version before promising that change.

After saving, GET info again and compare the intended fields, including active and cron state.

## Test drafts and execute saved code

### Draft test

Open the edit form and use **Test Code**, or the code editor's preview. Supply a JSON payload and inspect **Test Result**, return value, and logs. Test at least a valid input, an invalid input, and any important external-service error path.

The dashboard uses `worker.testCode` with `workspaceId`, `code`, optional `workerId`, `payload`, `environmentVariables`, and `moduleBindings`. An existing `workerId` allows saved variables/bindings to be resolved. Without it, supply required draft configuration. This is a dashboard tRPC procedure, not a `/open/.../testCode` endpoint.

Omit `environmentVariables` to test with all saved values, including Secrets. Supplying a draft array replaces that collection for the test only; keep existing Secret IDs with no `value` to reuse them. Omitted `moduleBindings` are resolved from the draft's imports while preserving existing pins for used aliases. No test configuration is saved.

Tests use `context.type === 'test'` and isolated KV; they do not save draft code or create normal execution-history records. **Outbound `request` calls still reach real services.** Use test credentials/endpoints or a payload-controlled dry run when appropriate, and preserve the intended production behavior.

### Manual execution

Use the run action on the Worker detail/editor page. This executes **saved code** with `context.type === 'manual'` and records an execution. It is the dashboard's `worker.execute` procedure (`workspaceId`, `workerId`, optional `payload`). Manual execution can run an inactive Worker; pausing does not block an authorized manual run.

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

The dashboard uses `worker.getExecutions` (`workspaceId`, `workerId`, `page` starting at 1, `pageSize` default 20, maximum 100). There is no current OpenAPI execution-history/logs route or CLI logs command.

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

The dashboard reads variables using `worker.getEnvironmentVariables` with `workspaceId` and `workerId`; this is not exported through OpenAPI. Prefer the dashboard when a complete current list is unavailable.

For an intentional API update, include `environmentVariables` in a complete upsert body:

```json
[
  { "id": "existing-text-id", "key": "REGION", "type": "Text", "value": "eu" },
  { "id": "existing-secret-id", "key": "API_TOKEN", "type": "Secret" },
  { "key": "NEW_SETTING", "type": "Text", "value": "enabled" }
]
```

This array is a **complete replacement**: retain every unrelated row and ID. An empty array deletes all variables. Omit the entire field to preserve the collection. Existing Secrets are preserved by keeping their `id`, key, and `type: "Secret"` while omitting `value`. Sending an empty string changes the Secret to an empty string. New or rotated Secrets need a real `value`, supplied through secure input rather than chat, shell history, or committed files.

Keys must be unique and match `^[A-Za-z_][A-Za-z0-9_]*$`, up to 255 characters. Test the relevant behavior after saving without revealing the values.

## Configure schedules

Use the edit form to enable cron and preview its next runs. Set all of `active: true`, `enableCron: true`, and a valid `cronExpression`; keep other settings unchanged in API upserts. Schedules must run no more often than once per minute. Expressions use the workspace timezone, falling back to UTC; check that timezone before interpreting a time such as `0 9 * * *`.

Scheduled runs receive an empty payload and `context.type === 'cron'`. Code must not assume HTTP request context or mandatory HTTP payload fields. Verify the next scheduled execution in history; a successful manual run alone does not verify scheduling.

To disable only scheduling, set `enableCron: false` while explicitly preserving `active` and the desired expression. To pause HTTP and cron together, use the active endpoint below.

## Review and roll back revisions

Use **Revisions** to compare code and select a revision, or list revisions through the API:

```bash
curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer $TIANJI_API_KEY" "$WORKER_API/$WORKER_ID/revisions"
```

Use the chosen record's **`id`**, not its display revision number, in `rollback.json`:

```json
{ "revisionId": "actual-revision-id" }
```

```bash
curl --fail-with-body --silent --show-error \
  -X POST -H "Authorization: Bearer $TIANJI_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @rollback.json "$WORKER_API/$WORKER_ID/rollback"
```

Rollback restores code and pinned shared-module bindings. It preserves current name, description, active state, cron configuration, and environment variables; it is **not a configuration rollback**. Code/binding changes create a new revision; configuration-only edits do not. Verify current code/settings afterward, then test behavior using the current environment.

## Pause, resume, and delete

Despite its name, `toggleActive` sets the supplied value explicitly:

```bash
curl --fail-with-body --silent --show-error \
  -X PATCH -H "Authorization: Bearer $TIANJI_API_KEY" \
  -H 'Content-Type: application/json' --data '{"active":false}' \
  "$WORKER_API/$WORKER_ID/toggleActive"
```

Send `true` to resume. This preserves cron fields. Inactive Workers reject public HTTP triggers and do not run on cron; authorized manual execution remains possible. Re-read info to verify the state.

For explicitly requested permanent removal, first retain any code/configuration the user needs, then use the dashboard delete action or `DELETE /{workerId}/delete`. This requires workspace admin permissions. Use pausing when the request is only to stop normal triggers; deleting is not necessary. After deletion, verify the Worker no longer appears in the list.
