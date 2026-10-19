---
sidebar_position: 5
_i18n_hash: 3656796ebf02a33e45fbef1ecb18923e
---
# Webhook

Wenn Sie eine flexiblere Benachrichtigungsmethode benötigen, können Sie versuchen, benutzerdefinierte Webhooks zu verwenden, um Ihre Nachrichten zu benachrichtigen. Auf diese Weise können Sie Benachrichtigungen von Tianji in jedes System integrieren.

### Beispielergebnis

Das Tianji-System sendet eine POST-Anfrage mit folgendem Beispielinhalt.

```json
{
    "notification": {
        "workspaceId": "xxxxxxxxxxx",
        "name": "Neue Benachrichtigung",
        "type": "webhook",
        "payload": {
            "webhookUrl": "example.com"
        }
    },
    "title": "Neue Benachrichtigung Benachrichtigungstest",
    "content": "Tianji: Einblick in alles\\nDies ist ein Benachrichtigungstest von Neuer Benachrichtigung\\n[image]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "Tianji: Einblick in alles"
        },
        {
            "type": "text",
            "content": "Dies ist ein Benachrichtigungstest von Neuer Benachrichtigung"
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
