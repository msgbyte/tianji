---
sidebar_position: 4
_i18n_hash: 0a395db245537dd2e052b4525326e318
---
# ステート（進行中のインシデント）

フィードステートは、変更不可能な `eventId` を持つ進行中のインシデントをモデル化します。解決されるまで同じ `eventId` に何度でもアップサートで更新を行うことができます。

## エンドポイント

- ステートのアップサート（公開）：`POST /open/feed/{channelId}/state/upsert`
- ステートの解決（認証）：`POST /open/workspace/{workspaceId}/feed/{channelId}/state/resolve`
- 進行中のステート一覧（認証）：`GET /open/workspace/{workspaceId}/feed/state/all?channelId=...&limit=...`

## アップサートボディ

```json
{
  "eventId": "deploy#2025-08-12",
  "eventName": "deploy_progress",
  "eventContent": "ロールアウト 60%",
  "tags": ["prod"],
  "source": "ci",
  "senderId": "runner-42",
  "senderName": "GitHub Actions",
  "important": true,
  "payload": {"stage": "canary"}
}
```

チャンネルが `webhookSignature` を設定している場合、ヘッダー `x-webhook-signature` を含める必要があります。

## 解決の例

```bash
curl -X POST \
  "$BASE_URL/workspace/$WORKSPACE_ID/feed/$CHANNEL_ID/state/resolve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stateId": "STATE_ID"}'
```
