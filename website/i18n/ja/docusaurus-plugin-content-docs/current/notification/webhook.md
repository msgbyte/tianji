---
sidebar_position: 5
_i18n_hash: 4ea8ae049c2d4b09f2847744ac37545f
---
# Webhook

より柔軟な通知方法が必要な場合は、カスタムWebhookを使用してメッセージを通知することができます。この方法で、天機の通知を任意のシステムに統合することができます。

### 例

天機システムは、以下の例のような内容でPOSTリクエストを送信します。

```json
{
    "notification": {
        "workspaceId": "xxxxxxxxxxx",
        "name": "新しい通知",
        "type": "webhook",
        "payload": {
            "webhookUrl": "example.com"
        }
    },
    "title": "新しい通知のテスト",
    "content": "天機: すべての洞察\\nこれは新しい通知からの通知テストです\\n[image]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "天機: すべての洞察"
        },
        {
            "type": "text",
            "content": "これは新しい通知からの通知テストです"
        },
        {
            "type": "newline"
        },
        {
            "type": "image",
            "url": "https://tianji.msgbyte.com/img/social-card.png"
        }
    ],
    "time": "2024-06-19T15:41:09.390Z"
}
```
