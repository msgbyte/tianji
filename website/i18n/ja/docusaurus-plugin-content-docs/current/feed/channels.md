---
sidebar_position: 2
_i18n_hash: f5e0cd17d30a2d7438fa8962eadfd7b5
---
# チャンネル

チャンネルはイベントのコンテナです。異なる製品やチーム、環境のために複数のチャンネルを作成することができます。

## チャンネルを作成する

コンソール → フィード → チャンネルを追加。

フィールド

- name: 表示名
- notifyFrequency: このチャンネルの通知頻度を制御
- notificationIds: ファンアウトを受信する既存の通知ターゲットを選択

## チャンネルを編集する

名前、notificationIds、notifyFrequencyを更新し、オプションでwebhookSignatureを設定することができます。署名が設定されると、このチャンネルへの公開ウェブフックは `x-webhook-signature` ヘッダーに同じ値を含める必要があります。

## API

- チャンネル一覧: GET `/open/workspace/{workspaceId}/feed/channels`
- チャンネル情報: GET `/open/workspace/{workspaceId}/feed/{channelId}/info`
- 更新: POST `/open/workspace/{workspaceId}/feed/{channelId}/update`
- 作成: POST `/open/workspace/{workspaceId}/feed/createChannel`
- 削除: DELETE `/open/workspace/{workspaceId}/feed/{channelId}/del`

例 (通知ターゲットの更新)

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
