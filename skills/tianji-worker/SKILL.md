---
name: tianji-worker
description: Use when creating, testing, deploying, invoking, debugging, scheduling, pausing, or rolling back Tianji Workers, or managing their environment variables and shared modules.
---

# Tianji Worker

Operate Tianji Workers using the dashboard, CLI, and supported management API.

## Start here

1. Identify the requested operation, Tianji server, workspace, and existing Worker ID or new Worker name. Use existing configuration where available; never guess a target.
2. Read [Common operations](references/operations.md) before operating a Worker. It contains exact API routes, request bodies, dashboard paths, and configuration preservation rules.
3. Before writing or modifying code, read [Runtime reference](references/agent-reference.md). Tianji's sandbox differs from Node.js, browsers, and Cloudflare Workers.
4. For an existing Worker, inspect its current code, active state, cron settings, and revisions before changing it. Preserve unrelated settings. Carry out the user's authorized scope; a request for sample code alone does not authorize deployment.

## Choose the supported interface

| Task                                                   | Interface                                                                  |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| Create a local project; pull compiled code             | `tianji worker init`; `tianji worker pull`                                 |
| Create or update a deployed Worker                     | Dashboard or OpenAPI `upsert`; CLI `deploy` has configuration side effects |
| Test draft code and payloads                           | Dashboard **Test Code** / editor preview                                   |
| Invoke a public Worker                                 | HTTP `/api/worker/{workspaceId}/{workerId}`                                |
| Run a stored Worker manually; inspect logs             | Dashboard **Executions** / run action                                      |
| Configure cron, Text/Secret variables, module bindings | Dashboard edit form; read preservation rules before API updates            |
| Inspect or roll back code revisions                    | Dashboard **Revisions** or OpenAPI                                         |
| Pause/resume; delete                                   | OpenAPI or dashboard; deletion requires workspace admin rights             |

Do not invent CLI commands or OpenAPI routes for tests, logs, or environment-variable reads. Those operations currently use authenticated dashboard tRPC calls.

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
