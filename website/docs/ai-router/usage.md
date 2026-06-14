---
sidebar_position: 2
---

# AI Router usage

AI Router exposes OpenAI-compatible and Anthropic-compatible endpoints under your Tianji server:

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/<provider>/v1/...
```

The `<provider>` segment must match the provider mode you configured on the route.

## Supported endpoints

| Provider segment | Chat Completions | Responses | Anthropic Messages |
| --- | --- | --- | --- |
| `openai` | `/openai/v1/chat/completions` | `/openai/v1/responses` | - |
| `deepseek` | `/deepseek/v1/chat/completions` | - | - |
| `anthropic` | `/anthropic/v1/chat/completions` | - | `/anthropic/v1/messages` |
| `openrouter` | `/openrouter/v1/chat/completions` | - | `/openrouter/v1/messages` |
| `custom` | `/custom/v1/chat/completions` | `/custom/v1/responses` | `/custom/v1/messages` |

## OpenAI Chat Completions

Base URL for OpenAI SDK:

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1
```

Node.js:

```js
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello from Tianji AI Router' }],
});

console.log(response.choices[0].message);
```

cURL:

```bash
curl -X POST 'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_TIANJI_API_KEY>' \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": "Hello from Tianji AI Router"
      }
    ]
  }'
```

## OpenAI Responses

Base URL for OpenAI SDK:

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1
```

Node.js:

```js
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1',
});

const response = await client.responses.create({
  model: 'gpt-4o',
  input: 'Write a short deployment checklist.',
});

console.log(response.output_text);
```

cURL:

```bash
curl -X POST 'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1/responses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_TIANJI_API_KEY>' \
  -d '{
    "model": "gpt-4o",
    "input": "Write a short deployment checklist."
  }'
```

## Anthropic Messages

Base URL for Anthropic SDK:

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/anthropic
```

Node.js:

```js
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/anthropic',
});

const message = await client.messages.create({
  model: 'claude-opus-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello from Tianji AI Router' }],
});

console.log(message.content);
```

cURL:

```bash
curl -X POST 'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/anthropic/v1/messages' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: <YOUR_TIANJI_API_KEY>' \
  -H 'anthropic-version: 2023-06-01' \
  -d '{
    "model": "claude-opus-4-20250514",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Hello from Tianji AI Router"
      }
    ]
  }'
```

## Custom provider routes

Use the `custom` provider segment when the selected AI Gateway stores a custom base URL or custom model name.

Examples:

```bash
/api/ai-router/<workspaceId>/<routerId>/custom/v1/chat/completions
/api/ai-router/<workspaceId>/<routerId>/custom/v1/responses
/api/ai-router/<workspaceId>/<routerId>/custom/v1/messages
```

The custom upstream details stay on AI Gateway. AI Router only selects the route and forwards the normalized request.

## Recommended routing patterns

### Active backup

Use this when uptime matters more than traffic distribution.

| Tier | Route | Weight |
| --- | --- | ---: |
| 1 | Primary OpenAI gateway | 100 |
| 2 | OpenRouter gateway | 100 |
| 3 | Custom fallback gateway | 100 |

AI Router tries Tier 2 only after Tier 1 returns retryable failures.

### Weighted split

Use this when you want to share traffic across providers in normal operation.

| Tier | Route | Weight |
| --- | --- | ---: |
| 1 | Gateway A | 80 |
| 1 | Gateway B | 20 |

Both routes are in the same tier, so there is no primary/secondary order. The weights decide which route is likely to be tried first.

### Canary migration

Use this when testing a new provider.

| Tier | Route | Weight |
| --- | --- | ---: |
| 1 | Current provider | 95 |
| 1 | New provider | 5 |
| 2 | Stable fallback | 100 |

Increase the new provider weight after you confirm quality and reliability in the logs.

## Troubleshooting

### No eligible AI Router nodes are available

Check that:

- The router is enabled.
- At least one tier has enabled routes.
- The selected AI Gateway still has a stored model API key.
- The route provider supports the endpoint you are calling.

### The router stops after one failed attempt

AI Router only continues after retryable failures.

Network errors, timeouts, `429`, `500`, `502`, `503`, and `504` are retryable by default. Add route-specific retryable status codes if a provider uses other temporary failure codes.

### The wrong model is being used

Check both places:

- Route **Model Override**. If set, it replaces the request `model`.
- AI Gateway custom model name. For `custom` routes, the gateway can replace the model with its custom model name.

### The request returns 401 or 403

Use a Tianji API key in the runtime request. Do not send the upstream provider key to AI Router when the gateway stores its own provider credential.

For OpenAI-compatible endpoints, use:

```bash
Authorization: Bearer <YOUR_TIANJI_API_KEY>
```

For Anthropic Messages endpoints, use:

```bash
x-api-key: <YOUR_TIANJI_API_KEY>
```
