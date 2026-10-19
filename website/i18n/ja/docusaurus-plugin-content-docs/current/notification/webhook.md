---
sidebar_position: 5
_i18n_hash: 3656796ebf02a33e45fbef1ecb18923e
---
# Webhook

より柔軟な通知方法が必要な場合、カスタムウェブフックを使用してメッセージを通知することをお試しください。この方法で、天機の通知をあらゆるシステムに統合できます。

### 例の結果

天機システムは、以下のような内容でPOSTリクエストを送信します。

```json
{
    "notification": {
        "workspaceId": "xxxxxxxxxxx",
        "name": "新規通知",
        "type": "webhook",
        "payload": {
            "webhookUrl": "example.com"
        }
    },
    "title": "新規通知通知テスト",
    "content": "天機: すべてへの洞察\\nこれは新規通知からの通知テストです\\n[画像]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "天機: すべてへの洞察"
        },
        {
            "type": "text",
            "content": "これは新規通知からの通知テストです"
        },
        {
            "type": "newline"
        },
        {
            "type": "image",
            "url": "https://tianji.dev/img/social-card.png"
        }
    ],
    "time": "2024-06-19T15:41:09.390Z"
}
```
