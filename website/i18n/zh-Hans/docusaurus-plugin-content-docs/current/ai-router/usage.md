---
sidebar_position: 2
---

# AI 路由使用方式

AI Router 会在 Tianji 服务下暴露 OpenAI 兼容和 Anthropic 兼容 endpoint：

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/<provider>/v1/...
```

`<provider>` 需要与你在 route 中配置的 provider 模式一致。

## 支持的 endpoint

| Provider segment | Chat Completions | Responses | Anthropic Messages |
| --- | --- | --- | --- |
| `openai` | `/openai/v1/chat/completions` | `/openai/v1/responses` | - |
| `deepseek` | `/deepseek/v1/chat/completions` | - | - |
| `anthropic` | `/anthropic/v1/chat/completions` | - | `/anthropic/v1/messages` |
| `openrouter` | `/openrouter/v1/chat/completions` | - | `/openrouter/v1/messages` |
| `custom` | `/custom/v1/chat/completions` | `/custom/v1/responses` | `/custom/v1/messages` |

## OpenAI Chat Completions

OpenAI SDK 使用的 base URL：

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1
```

Node.js：

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

cURL：

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

OpenAI SDK 使用的 base URL：

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1
```

Node.js：

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

cURL：

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

Anthropic SDK 使用的 base URL：

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/anthropic
```

Node.js：

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

cURL：

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

当所选 AI Gateway 存储了 custom base URL 或 custom model name 时，使用 `custom` provider segment。

示例：

```bash
/api/ai-router/<workspaceId>/<routerId>/custom/v1/chat/completions
/api/ai-router/<workspaceId>/<routerId>/custom/v1/responses
/api/ai-router/<workspaceId>/<routerId>/custom/v1/messages
```

自定义上游细节仍然保存在 AI Gateway。AI Router 只负责选择 route 并转发规范化后的请求。

## 推荐路由模式

### 主备模式

当服务可用性比流量分布更重要时，使用这种方式。

| Tier | Route | Weight |
| --- | --- | ---: |
| 1 | Primary OpenAI gateway | 100 |
| 2 | OpenRouter gateway | 100 |
| 3 | Custom fallback gateway | 100 |

AI Router 只有在 Tier 1 返回可重试失败后，才会尝试 Tier 2。

### 权重分流

当你希望正常情况下多个 provider 同时承担流量时，使用这种方式。

| Tier | Route | Weight |
| --- | --- | ---: |
| 1 | Gateway A | 80 |
| 1 | Gateway B | 20 |

两个 route 在同一个 tier 内，因此没有主备顺序。权重决定哪个 route 更可能被优先尝试。

### Canary 迁移

测试新 provider 时可以这样配置。

| Tier | Route | Weight |
| --- | --- | ---: |
| 1 | Current provider | 95 |
| 1 | New provider | 5 |
| 2 | Stable fallback | 100 |

确认日志中的质量和稳定性后，再逐步提高新 provider 的权重。

## 排障

### No eligible AI Router nodes are available

检查这些项：

- Router 已启用。
- 至少一个 tier 中有启用的 route。
- 所选 AI Gateway 仍然保存了 model API key。
- Route provider 支持你正在调用的 endpoint。

### Router 在一次失败后就停止

AI Router 只会在可重试失败后继续尝试。

网络错误、超时、`429`、`500`、`502`、`503` 和 `504` 默认可重试。如果某个 provider 使用其它临时失败状态码，可以给 route 增加额外 retryable status codes。

### 使用了错误模型

检查两个位置：

- Route 的 **Model Override**。如果设置了，它会替换请求里的 `model`。
- AI Gateway 的 custom model name。对于 `custom` route，gateway 可以用自定义模型名替换模型。

### 请求返回 401 或 403

运行时请求需要使用 Tianji API key。当 gateway 已经保存 provider 凭证时，不要把上游 provider key 直接发给 AI Router。

OpenAI 兼容 endpoint 使用：

```bash
Authorization: Bearer <YOUR_TIANJI_API_KEY>
```

Anthropic Messages endpoint 使用：

```bash
x-api-key: <YOUR_TIANJI_API_KEY>
```
