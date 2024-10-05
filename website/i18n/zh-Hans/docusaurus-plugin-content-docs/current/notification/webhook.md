---
sidebar_position: 5
_i18n_hash: 4ea8ae049c2d4b09f2847744ac37545f
---
# Webhook

如果你需要更灵活的通知方式，可以尝试使用自定义Webhook来通知你的消息。这样，你可以将天机的通知集成到任何系统中。

### 示例结果

天机系统将发送一个包含以下示例内容的POST请求。

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
    "title": "新通知测试",
    "content": "天机：洞察一切\\n这是来自新通知的测试通知\\n[图片]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "天机：洞察一切"
        },
        {
            "type": "text",
            "content": "这是来自新通知的测试通知"
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
