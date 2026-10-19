---
sidebar_position: 5
_i18n_hash: 3656796ebf02a33e45fbef1ecb18923e
---
# Webhook

如果您需要更灵活的通知方式，可以尝试使用自定义webhook来通知您的消息。通过这种方式，您可以将Tianji的通知集成到任何系统中。

### 示例结果

Tianji系统将发送一个包含以下示例内容的POST请求。

```json
{
    "notification": {
        "workspaceId": "xxxxxxxxxxx",
        "name": "新通知",
        "type": "webhook",
        "payload": {
            "webhookUrl": "example.com"
        }
    },
    "title": "新通知通知测试",
    "content": "Tianji: 洞察一切\\n这是来自新通知的通知测试\\n[图片]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "Tianji: 洞察一切"
        },
        {
            "type": "text",
            "content": "这是来自新通知的通知测试"
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
