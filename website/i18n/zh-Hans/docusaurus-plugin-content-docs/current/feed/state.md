---
sidebar_position: 4
_i18n_hash: 0a395db245537dd2e052b4525326e318
---
# 状态（持续事件）

Feed State 使用不可变的 `eventId` 来表示持续事件。您可以在事件解决之前，反复对同一个 `eventId` 插入或更新信息。

## 端点

- 插入或更新状态（公开）：`POST /open/feed/{channelId}/state/upsert`
- 解决状态（授权）：`POST /open/workspace/{workspaceId}/feed/{channelId}/state/resolve`
- 列出持续状态（授权）：`GET /open/workspace/{workspaceId}/feed/state/all?channelId=...&limit=...`

## 插入或更新请求体

```json
{
  "eventId": "deploy#2025-08-12",
  "eventName": "deploy_progress",
  "eventContent": "Rollout 60%",
  "tags": ["prod"],
  "source": "ci",
  "senderId": "runner-42",
  "senderName": "GitHub Actions",
  "important": true,
  "payload": {"stage": "canary"}
}
```

如果频道配置了 `webhookSignature`，则您必须在请求头中包含 `x-webhook-signature`。

## 解决示例

```bash
curl -X POST \
  "$BASE_URL/workspace/$WORKSPACE_ID/feed/$CHANNEL_ID/state/resolve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stateId": "STATE_ID"}'
```
