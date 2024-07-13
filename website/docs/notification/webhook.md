---
sidebar_position: 5
---

# Webhook

If you need a more flexible notification method, you can try using custom webhooks to notify your messages. This way, you can integrate Tianji's notifications into any system.

### Example Result

Tianji system will send a POST request with below example content.

```json
{
    "notification": {
        "workspaceId": "xxxxxxxxxxx",
        "name": "New Notification",
        "type": "webhook",
        "payload": {
            "webhookUrl": "example.com"
        }
    },
    "title": "New Notification Notification Testing",
    "content": "Tianji: Insight into everything\\nThis is Notification Testing from New Notification\\n[image]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "Tianji: Insight into everything"
        },
        {
            "type": "text",
            "content": "This is Notification Testing from New Notification"
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
