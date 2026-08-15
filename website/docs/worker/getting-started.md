---
sidebar_position: 1
title: Worker Getting Started
description: Create, test, configure, schedule, and deploy your first Tianji Worker.
---

# Worker Getting Started

Tianji Worker lets you run small functions without maintaining a separate service. A worker can receive HTTP requests, run on a schedule, call external APIs, read environment variables, and store short-lived data.

This guide walks you through creating and publishing your first worker in the Tianji dashboard. If you want an AI coding agent to generate the source code, see the [Worker Agent Reference](./agent-reference.md).

## Before you start

Worker is disabled by default on self-hosted Tianji instances. Add this environment variable to the Tianji server and restart it:

```bash
ENABLE_FUNCTION_WORKER=true
```

After Worker is enabled, open **Worker** from the Tianji sidebar.

## Ask an Agent to write your Worker

You do not need to write the Worker code by hand. Give the [Worker Agent Reference](./agent-reference.md) to your coding agent so it can learn Tianji's runtime and generate compatible code.

### If your Agent can open web pages

Copy the following prompt, replace the placeholders, and send it to your Agent:

```text
First, read the Tianji Worker Agent Reference completely:
https://tianji.dev/docs/worker/agent-reference

Then create a Tianji Worker for me.

Target: dashboard JavaScript
Purpose: <what the Worker should do>
Input: <payload fields and validation rules>
Environment variables: <variable names only; do not include Secret values>
External APIs: <APIs the Worker should call, or none>
Temporary data: <what to store in KV, or none>
Output: <the expected result>

Return the Worker source code and example test payloads. Do not deploy it.
```

For example, you can replace `Purpose` with “receive a GitHub webhook and forward a short message to my team webhook,” then list the required payload fields and environment-variable names.

### If your Agent cannot open web pages

1. Open the [Worker Agent Reference](./agent-reference.md).
2. Copy the entire page.
3. Paste it into your conversation with the Agent.
4. Add your Worker requirements using the prompt above.

Do not paste real API keys or passwords into the conversation. Give the Agent environment-variable names such as `API_TOKEN`; add the actual values later as **Secret** variables in Tianji.

After the Agent returns code:

1. Review the environment-variable names it requires.
2. Paste the code into the Tianji Worker editor.
3. Add Text and Secret variables in Tianji.
4. Run the provided valid and invalid test payloads.
5. Save and activate the worker only after the results are correct.

## Create your first worker

1. Open **Worker** in the dashboard.
2. Click **Add Worker**.
3. Enter a name and an optional description.
4. Paste the following code into the editor.

```js
export default {
  async fetch(payload, context) {
    const name = typeof payload.name === 'string' ? payload.name : 'world';

    return {
      message: `Hello, ${name}!`,
      trigger: context.type,
      timestamp: new Date().toISOString(),
    };
  },
};
```

Every worker exports a `fetch` method. Tianji calls it with:

- `payload`: input values sent to the worker.
- `context`: information about the trigger, request, and configured environment variables.

The value returned by `fetch` becomes the worker result.

## Test before saving

Use the editor's **Test** action with this payload:

```json
{
  "name": "Tianji"
}
```

The result should look similar to:

```json
{
  "message": "Hello, Tianji!",
  "trigger": "test",
  "timestamp": "2026-08-16T00:00:00.000Z"
}
```

Use `console.log`, `console.warn`, or `console.error` while debugging. Tianji displays these messages in the execution details.

## Call a worker over HTTP

Save the worker, keep it **Active**, and make sure it is **Public**. Its endpoint is:

```text
https://<your-tianji-host>/api/worker/<workspace-id>/<worker-id>
```

You can pass values as query parameters:

```bash
curl 'https://<your-tianji-host>/api/worker/<workspace-id>/<worker-id>?name=Tianji'
```

Or send a JSON request body:

```bash
curl --request POST \
  --header 'Content-Type: application/json' \
  --data '{"name":"Tianji"}' \
  'https://<your-tianji-host>/api/worker/<workspace-id>/<worker-id>'
```

The endpoint accepts any HTTP method. Query parameters and request-body fields are merged into `payload`; body fields take precedence when the same key appears in both places.

A public worker can be called by anyone who has its URL and does not require a Tianji API key. Validate all input and never return credentials. Private workers cannot be called through the public endpoint, but you can test them from the authenticated dashboard.

## Handle different triggers

`context.type` tells you why the worker is running:

| Type | When it is used |
| --- | --- |
| `http` | The public HTTP endpoint called the worker |
| `cron` | A configured schedule triggered the worker |
| `manual` | A user ran the saved worker from Tianji |
| `test` | A user tested code in the editor |

For HTTP calls, `context.request` contains the request method, URL, and headers:

```js
export default {
  async fetch(payload, context) {
    if (context.type !== 'http') {
      return { error: 'This worker accepts HTTP requests only' };
    }

    return {
      method: context.request.method,
      payload,
    };
  },
};
```

## Add environment variables and secrets

Open the worker's environment-variable section and add:

- **Text** variables for non-sensitive settings such as a base URL.
- **Secret** variables for API keys, tokens, and passwords.

Read both types from `context.env`:

```js
const apiBaseUrl = context.env.API_BASE_URL;
const apiToken = context.env.API_TOKEN;
```

Variable names can contain letters, numbers, and underscores, but must start with a letter or underscore. Names must be unique within a worker.

Tianji replaces configured Secret values with `[secret]` in captured logs. A worker can still send or return a secret, so do not log or return credentials intentionally.

## Call an external API

Use the global `request` function for outbound HTTP requests:

```js
export default {
  async fetch(payload, context) {
    const apiBaseUrl = context.env.API_BASE_URL;
    const apiToken = context.env.API_TOKEN;

    if (!apiBaseUrl || !apiToken) {
      throw new Error('API configuration is missing');
    }

    const response = await request({
      method: 'GET',
      url: `${apiBaseUrl}/items`,
      params: { query: String(payload.query ?? '') },
      headers: { Authorization: `Bearer ${apiToken}` },
      timeout: 10_000,
    });

    return {
      status: response.status,
      data: response.data,
    };
  },
};
```

`request` accepts an Axios-style configuration and returns `status`, `headers`, and `data`. The browser `fetch` API is not available in the Worker sandbox.

## Store short-lived data

Use the global `kv` object when a worker needs temporary state:

```js
export default {
  async fetch(payload) {
    const key = `count:${String(payload.name ?? 'anonymous')}`;
    const current = (await kv.get(key)) ?? 0;
    const next = Number(current) + 1;

    await kv.set(key, next, 60 * 60 * 1000);

    return { count: next };
  },
};
```

The available operations are:

- `kv.get(key)`
- `kv.set(key, value, ttlMilliseconds?)`
- `kv.delete(key)`

Data stored with `kv` is private to the current worker. Use `kv.workspace` only when multiple workers in the same workspace intentionally share temporary data.

KV is a cache rather than a durable database. Entries expire and may be evicted, so your worker must handle missing values. The default TTL is 10 minutes and the maximum TTL is 24 hours. See the [Worker Agent Reference](./agent-reference.md#kv-contract) for the complete limits and error codes.

## Run on a schedule

Enable **Cron Schedule** in the worker editor and enter a cron expression. The minimum interval is one minute. Schedules use the workspace timezone, or UTC when no workspace timezone is configured.

Common expressions:

| Expression | Meaning |
| --- | --- |
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | At the start of every hour |
| `0 9 * * 1-5` | At 09:00, Monday through Friday |

You can restrict a worker to scheduled runs:

```js
export default {
  async fetch(payload, context) {
    if (context.type !== 'cron') {
      return { skipped: true, reason: 'cron only' };
    }

    const webhookUrl = context.env.WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('WEBHOOK_URL is not configured');
    }

    const response = await request({
      method: 'POST',
      url: webhookUrl,
      data: { executedAt: new Date().toISOString() },
      timeout: 10_000,
    });

    return { delivered: response.status >= 200 && response.status < 300 };
  },
};
```

## Develop with the CLI

The dashboard is the quickest way to create a worker. Use the CLI when you want a local TypeScript project, third-party dependencies, version control, and a repeatable build.

Build and link the current CLI from the Tianji repository:

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install
pnpm --dir packages/cli build
cd packages/cli
pnpm link --global
```

Then create and deploy a project from your projects directory:

```bash
tianji login
tianji worker init my-worker
cd my-worker
npm install
npm run build
tianji worker deploy
```

`tianji login` asks for your Tianji server URL, workspace ID, and API key. The deploy command builds `src/index.ts`, uploads `dist/index.js`, and records the remote worker ID in `.tianjirc`.

To download an existing worker into an empty directory:

```bash
tianji worker pull <worker-id>
npm install
```

Pulling into an existing project does not replace `src/index.ts` unless you explicitly pass `--overwrite`. Configure environment variables, secrets, visibility, and cron in the dashboard. Do not put credentials in source code or `.tianjirc`.

## Troubleshooting

### `Function worker is not enabled`

Set `ENABLE_FUNCTION_WORKER=true` on the Tianji server and restart it.

### `fetch is not defined`

Make sure the worker has a default export containing a `fetch` method, as shown in the first example.

### `Worker is private`

Private workers cannot run through the public HTTP endpoint. Test the worker from the authenticated dashboard, or make it public only when unauthenticated link access is intended.

### TypeScript causes a syntax error in the dashboard

Use plain JavaScript in the dashboard. TypeScript syntax requires the server option `ENABLE_FUNCTION_WORKER_TYPESCRIPT_SUPPORT`. CLI projects compile TypeScript before uploading it.

### A KV value disappears

KV data expires and may be evicted. Use an external durable database when the data must not be lost.

## Generate a worker with an Agent

Follow [Ask an Agent to write your Worker](#ask-an-agent-to-write-your-worker) to give the reference to your Agent. The [Worker Agent Reference](./agent-reference.md) provides the precise runtime contract, type definitions, sandbox restrictions, KV limits, generation checklist, and a more detailed prompt template.
