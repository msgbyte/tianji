---
sidebar_position: 2
title: Worker Agent Reference
description: A precise Tianji Worker runtime contract for coding agents that generate Worker source code.
---

# Worker Agent Reference

This page is a machine-oriented reference for coding agents that generate Tianji Worker source code. For the user-facing setup and operation guide, read [Worker Getting Started](./getting-started.md).

Read this page completely before generating code. Do not infer Node.js, browser, or Cloudflare Worker APIs that are not declared here.

## Give this page to an Agent

If you are a Tianji user, copy this page's URL and send it to an Agent that can access web pages:

```text
Read this reference completely before writing code:
https://tianji.dev/docs/worker/agent-reference
```

If the Agent cannot access the URL, copy and paste the entire page into the conversation instead. Then describe the Worker's purpose, input, environment-variable names, external APIs, temporary data, and expected output. Never include real Secret values.

The [Worker Getting Started guide](./getting-started.md#ask-an-agent-to-write-your-worker) provides a ready-to-copy request template and the complete user workflow.

## Choose the target

There are two valid generation targets:

| Target | Output |
| --- | --- |
| Tianji dashboard | One self-contained source file using plain JavaScript syntax |
| Tianji CLI project | `src/index.ts`; TypeScript and bundled npm dependencies are allowed |

Dashboard code should use plain JavaScript unless the Tianji instance explicitly enables `ENABLE_FUNCTION_WORKER_TYPESCRIPT_SUPPORT`. A CLI project uses Vite to compile TypeScript before deployment.

Generate a Module Worker. Do not generate the legacy global `function fetch(...) {}` format.

```js
export default {
  async fetch(payload, context) {
    return { ok: true };
  },
};
```

## Runtime types

Use this contract for reasoning and TypeScript generation:

```ts
type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

interface WorkerRequestContext {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

interface WorkerContext {
  type: 'http' | 'cron' | 'manual' | 'test';
  env: Record<string, string>;
  request?: WorkerRequestContext;
}

interface TianjiWorker {
  fetch(
    payload: Record<string, unknown>,
    context: WorkerContext
  ): unknown | Promise<unknown>;
}

interface RequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  data?: unknown;
  timeout?: number;
}

interface RequestResult {
  status: number;
  headers: Record<string, unknown>;
  data: unknown;
}

declare function request(config: RequestConfig): Promise<RequestResult>;

interface KVScope {
  get<T extends JsonValue = JsonValue>(key: string): Promise<T | undefined>;
  set(key: string, value: JsonValue, ttlMilliseconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
}

declare const kv: KVScope & { workspace: KVScope };
```

The types above document runtime globals. Do not include the `declare` statements in dashboard JavaScript output. A CLI TypeScript project may include declarations when type checking needs them.

## Input contract

- `payload` is always an object.
- For HTTP execution, Tianji merges query parameters and the request body. Body fields overwrite query fields with the same name.
- A cron execution without input receives `{}`.
- Treat every payload field as untrusted. Check its type, required status, format, length, and allowed range before using it.
- Do not assume query parameters have already been converted to numbers or booleans.
- Reject or return a clear error for invalid input rather than silently constructing unsafe requests.

`context.request` exists only when `context.type === 'http'`. Guard access to it:

```js
if (context.type !== 'http') {
  return { error: 'HTTP trigger required' };
}

const method = context.request.method;
```

## Output contract

- Return JSON-compatible objects and arrays, a string, or a number.
- For an HTTP trigger, Tianji serializes object results as JSON.
- Do not return secrets or internal error objects.
- Normalize upstream API responses into a stable result owned by the worker.
- Use `console.log`, `console.warn`, and `console.error` for execution logs.

## Sandbox contract

The Worker sandbox provides standard JavaScript built-ins, captured `console` methods, `request`, and `kv`.

The sandbox is not Node.js and not a browser. Do not generate code that uses:

- `process`, `Buffer`, filesystem, child processes, sockets, or other Node.js APIs.
- DOM APIs, browser storage, or browser `fetch`.
- Cloudflare Worker bindings or event handlers.
- Undocumented globals.

For outbound HTTP, use `request` with an Axios-style configuration:

```js
const response = await request({
  method: 'POST',
  url: context.env.API_URL,
  headers: { Authorization: `Bearer ${context.env.API_TOKEN}` },
  data: { value: payload.value },
  timeout: 10_000,
});
```

Check required URLs and credentials before calling `request`. Handle remote failures and avoid placing credentials in query strings.

## Environment and Secret contract

Environment values are available only through `context.env`:

```js
const apiUrl = context.env.API_URL;
const apiToken = context.env.API_TOKEN;
```

Variable names match `^[A-Za-z_][A-Za-z0-9_]*$` and are unique within a worker.

Text and Secret values are both strings at runtime. Secret values are replaced with `[secret]` in captured log strings, arrays, nested object values, and object keys. Empty Secret values are not redacted.

Log redaction does not prevent exfiltration. Worker code can still return a secret or send it to an external service. Use a Secret only for its intended outbound request, and never intentionally log or return it.

## KV contract

`kv` stores data private to the current worker. `kv.workspace` shares data across workers in the same workspace and must be used only when cross-worker sharing is intentional.

```js
const cached = await kv.get('result');
await kv.set('result', { ok: true }, 60_000);
const deleted = await kv.delete('result');
```

KV limits apply to each execution:

| Limit | Value |
| --- | ---: |
| Default TTL | 10 minutes |
| Minimum TTL | 1 second |
| Maximum TTL | 24 hours |
| Key length | 1-256 characters |
| Value size | 256 KiB of JSON |
| Calls across both scopes | 50 |
| Total data written across both scopes | 1 MiB |
| Timeout for one KV operation | 2 seconds |

Values must be JSON-compatible. Functions, symbols, `undefined`, `BigInt`, non-finite numbers, class instances, custom `toJSON` methods, symbol properties, accessors, non-enumerable properties, and cyclic data are invalid.

KV failures expose one stable error code:

```text
WORKER_KV_INVALID_KEY
WORKER_KV_INVALID_VALUE
WORKER_KV_INVALID_TTL
WORKER_KV_LIMIT_EXCEEDED
WORKER_KV_TIMEOUT
WORKER_KV_UNAVAILABLE
```

KV is cache storage, not durable storage. Always handle `undefined` from `get`. Test executions use isolated KV namespaces and cannot read or modify the deployed worker's KV data.

## Trigger contract

Generate code that supports only the requested triggers and handles unexpected triggers explicitly.

- HTTP: `context.type === 'http'`; `context.request` is present.
- Cron: `context.type === 'cron'`; payload is normally `{}`.
- Manual: `context.type === 'manual'`.
- Editor test: `context.type === 'test'`; test KV is isolated.

Cron expressions have a minimum interval of one minute. Execution uses the workspace timezone or UTC if none is configured.

The public HTTP route is:

```text
/api/worker/<workspace-id>/<worker-id>
```

Only active, public workers can execute through this route. It does not require a Tianji API key. Treat the endpoint as public and the payload as attacker-controlled. Private workers are rejected by the public route and can be tested through authenticated Tianji operations.

## Generation checklist

Before returning generated Worker code, verify all of the following:

1. The output uses a default-exported object with exactly one `async fetch(payload, context)` method.
2. It matches the requested dashboard JavaScript or CLI TypeScript target.
3. Every payload field is validated before use.
4. Configuration and credentials come from named `context.env` keys.
5. No real credential or placeholder that resembles a real credential is embedded in source.
6. Outbound HTTP uses `request`, validates required configuration, sets a timeout, and handles failures.
7. Temporary private data uses `kv`; `kv.workspace` appears only when cross-worker sharing was explicitly requested.
8. KV keys, values, TTLs, and operation counts stay within the documented limits.
9. The result is JSON-compatible and does not expose secrets or unnecessary upstream response data.
10. The code does not use Node.js, browser, Cloudflare, or undocumented runtime APIs.
11. At least one valid and one invalid test payload are described separately from the source code.
12. The agent does not deploy, overwrite remote code, change visibility, or add Secret values without explicit user authorization.

## Prompt template

```text
Read the Tianji Worker Agent Reference completely. Generate Worker source code
using only its documented runtime contract.

Target: <dashboard JavaScript or CLI TypeScript>
Triggers: <http, cron, manual, or test>
Input: <fields, types, required fields, and validation rules>
Environment: <context.env variable names; never include real values>
External APIs: <method, endpoint behavior, authentication, and timeout>
KV: <private or workspace scope, keys, values, and TTL; or none>
Output: <stable JSON response schema>
Failures: <invalid input, missing configuration, remote errors, missing KV>

Return the source code first, followed by valid and invalid test payloads.
Do not deploy, overwrite remote code, or include real Secret values.
```

## Agent-readable documentation

Tianji publishes a documentation index at [`/llms.txt`](https://tianji.dev/llms.txt) and the complete documentation corpus at [`/llms-full.txt`](https://tianji.dev/llms-full.txt). This reference and the user-facing guide are included in the full corpus.
