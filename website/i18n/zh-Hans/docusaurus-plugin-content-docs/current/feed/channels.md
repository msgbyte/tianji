---
sidebar_position: 2
_i18n_hash: f5e0cd17d30a2d7438fa8962eadfd7b5
---
# 频道

频道是事件的容器。您可以为不同的产品/团队/环境创建多个频道。

## 创建频道

控制台 → 动态 → 添加频道。

字段

- name: 显示名称
- notifyFrequency: 控制此频道的通知发送频率
- notificationIds: 选择现有的通知目标进行扩散

## 编辑频道

您可以更新名称、notificationIds、notifyFrequency，并设置一个可选的webhookSignature。一旦设置了签名，任何公共webhook发送到该频道时都必须包含header `x-webhook-signature`，其值必须相同。

## API

- 列出频道: GET `/open/workspace/{workspaceId}/feed/channels`
- 频道信息: GET `/open/workspace/{workspaceId}/feed/{channelId}/info`
- 更新: POST `/open/workspace/{workspaceId}/feed/{channelId}/update`
- 创建: POST `/open/workspace/{workspaceId}/feed/createChannel`
- 删除: DELETE `/open/workspace/{workspaceId}/feed/{channelId}/del`

示例（更新通知目标）

```bash
curl -X POST \
  "$BASE_URL/workspace/$WORKSPACE_ID/feed/$CHANNEL_ID/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ops",
    "notifyFrequency": 60,
    "notificationIds": ["notif_123", "notif_456"]
  }'
```
