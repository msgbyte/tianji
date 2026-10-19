---
sidebar_position: 2
_i18n_hash: c5728e8d9970ba12114c782ea0f3f562
---
```
# AIルーターの使い方

AIルーターは、Tianjiサーバー上でOpenAI互換およびAnthropic互換のエンドポイントを提供します：

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/<provider>/v1/...
```

`<provider>` セグメントは、ルートで設定したプロバイダーモードに一致している必要があります。

## サポートされるエンドポイント

| プロバイダーセグメント | Chat Completions | Responses | Anthropic Messages |
| --- | --- | --- | --- |
| `openai` | `/openai/v1/chat/completions` | `/openai/v1/responses` | - |
| `deepseek` | `/deepseek/v1/chat/completions` | - | - |
| `anthropic` | `/anthropic/v1/chat/completions` | - | `/anthropic/v1/messages` |
| `openrouter` | `/openrouter/v1/chat/completions` | - | `/openrouter/v1/messages` |
| `custom` | `/custom/v1/chat/completions` | `/custom/v1/responses` | `/custom/v1/messages` |

## OpenAI Chat Completions

OpenAI SDKのベースURL：

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

OpenAI SDKのベースURL：

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

Anthropic SDKのベースURL：

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

## カスタムプロバイダールート

選択されたAIゲートウェイがカスタムベースURLまたはカスタムモデル名を格納している場合は、`custom` プロバイダーセグメントを使用します。

例：

```bash
/api/ai-router/<workspaceId>/<routerId>/custom/v1/chat/completions
/api/ai-router/<workspaceId>/<routerId>/custom/v1/responses
/api/ai-router/<workspaceId>/<routerId>/custom/v1/messages
```

カスタム上流の詳細はAIゲートウェイに保持されます。AIルーターはルートを選択し、正規化されたリクエストを転送するだけです。

## 推奨ルーティングパターン

### アクティブバックアップ

稼働時間がトラフィック分散よりも重要な場合に使用します。

| Tier | ルート | 重み |
| --- | --- | ---: |
| 1 | プライマリOpenAIゲートウェイ | 100 |
| 2 | OpenRouterゲートウェイ | 100 |
| 3 | カスタムフォールバックゲートウェイ | 100 |

AIルーターは、Tier 1がリトライ可能な失敗を返した場合にのみTier 2を試します。

### 重み付き分割

通常運用でプロバイダー間でトラフィックを共有したい場合に使用します。

| Tier | ルート | 重み |
| --- | --- | ---: |
| 1 | ゲートウェイA | 80 |
| 1 | ゲートウェイB | 20 |

両方のルートは同じティアにあるため、プライマリ/セカンダリの順序はありません。どちらのルートが最初に試されやすいかは、重みによって決まります。

### カナリア移行

新しいプロバイダーをテストする際に使用します。

| Tier | ルート | 重み |
| --- | --- | ---: |
| 1 | 現行プロバイダー | 95 |
| 1 | 新規プロバイダー | 5 |
| 2 | 安定使用フォールバック | 100 |

ログで品質と信頼性を確認した後、モデルト重みを増やします。

## トラブルシューティング

### 使えるAIルーターノードがありません

確認事項：

- ルーターが有効化されていること。
- 少なくとも1つのティアに有効なルートがあること。
- 選択されたAIゲートウェイにモデルAPIキーがまだ格納されていること。
- ルートプロバイダーが呼び出しているエンドポイントをサポートしていること。

### 初回の失敗後にルーターが停止します

AIルーターは、リトライ可能な失敗後にのみ続行します。

ネットワークエラー、タイムアウト、`429`、`500`、`502`、`503`、および`504`はデフォルトでリトライ可能です。プロバイダーが他の一時的な失敗コードを使用している場合は、ルート固有のリトライ可能なステータスコードを追加してください。

### 間違ったモデルが使用されています

両方の場所を確認してください：

- ルート**モデルオーバーライド**。設定されている場合、リクエストの`model`を置き換えます。
- AIゲートウェイカスタムモデル名。`custom`ルートの場合、ゲートウェイがモデルをそのカスタムモデル名に置き換えることがあります。

### リクエストが401または403を返します

ランタイムリクエストでTianji APIキーを使用します。ゲートウェイが独自のプロバイダークレデンシャルを保持している場合、アップストリームプロバイダーキーをAIルーターに送信しないでください。

OpenAI互換エンドポイント用には：

```bash
Authorization: Bearer <YOUR_TIANJI_API_KEY>
```

Anthropic Messagesエンドポイント用には：

```bash
x-api-key: <YOUR_TIANJI_API_KEY>
```
```
