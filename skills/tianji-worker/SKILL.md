---
name: tianji-worker
description: Use when creating, testing, deploying, invoking, debugging, scheduling, pausing, or rolling back Tianji Workers, or managing their environment variables and shared modules.
---

# Tianji Worker

Operate Tianji Workers using the dashboard, CLI, and supported management API.

## Start here

1. Identify the requested operation, Tianji server, workspace, and existing Worker ID or new Worker name. Use existing configuration where available; never guess a target.
2. Fetch and read the target instance's `/open/_document` before operating a Worker. Use its OpenAPI document to confirm exported operations, HTTP methods, paths, and parameter/body schemas. Follow [Connect and inspect](references/operations.md#connect-and-inspect) for discovery and unavailable-document handling; bundled examples are not the target's API contract.
3. Read [Common operations](references/operations.md) for configuration preservation and execution rules. Operations absent from OpenAPI require the separately maintained [dashboard tRPC reference](references/operations.md#dashboard-trpc-fallback); never derive an OpenAPI route from a procedure name.
4. Before writing or modifying code, read [Runtime reference](references/agent-reference.md). Tianji's sandbox differs from Node.js, browsers, and Cloudflare Workers.
5. For an existing Worker, inspect its current code, active state, cron settings, and revisions before changing it. Preserve unrelated settings. Carry out the user's authorized scope; a request for sample code alone does not authorize deployment.

## Choose the supported interface

| Task                                                   | Interface                                                                  |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| Create a local project; pull compiled code             | `tianji worker init`; `tianji worker pull`                                 |
| Create or update a deployed Worker                     | Dashboard or OpenAPI `upsert`; CLI `deploy` has configuration side effects |
| Test draft code and payloads                           | Target OpenAPI if exported; otherwise dashboard **Test Code** / preview    |
| Invoke a public Worker                                 | HTTP `/api/worker/{workspaceId}/{workerId}`                                |
| Run a stored Worker manually; inspect logs             | Target OpenAPI if exported; otherwise dashboard **Executions** / run action |
| Configure cron, Text/Secret variables, module bindings | Dashboard edit form; read preservation rules before API updates            |
| Inspect or roll back code revisions                    | Dashboard **Revisions** or OpenAPI                                         |
| Pause/resume; delete                                   | OpenAPI or dashboard; deletion requires workspace admin rights             |

Use OpenAPI only for operations exported by the target. For missing operations, check the maintained dashboard tRPC reference and target version. OpenAPI discovery does not synchronize tRPC, CLI behavior, the public HTTP trigger, or runtime semantics.

## Runtime essentials

```js
export default {
  async fetch(payload, context) {
    return { ok: true, trigger: context.type };
  },
};
```

- Use `context.env` for Text/Secret values and `request` for outbound HTTP. No Node APIs, `process.env`, or browser `fetch`.
- Validate payloads. `context.type` is `http`, `cron`, `manual`, or `test`; only HTTP executions include `context.request`.
- `kv` is temporary Worker-scoped storage. Use `kv.workspace` only for intentional workspace sharing; neither is a durable database.
- Draft tests isolate KV, but outbound requests can still cause real side effects. Never print or return Secret values.

## Verify and report

For code changes, provide valid and invalid example payloads and required environment-variable names. After a requested mutation, re-read the Worker and verify the intended settings. Check execution results and logs for runtime success: saving code or receiving HTTP 200 alone is insufficient.

Report the target, changes, verification performed, and any remaining uncertainty. Distinguish draft tests, manual executions, public HTTP requests, and actual scheduled runs.
