---
sidebar_position: 5
_i18n_hash: 4ea8ae049c2d4b09f2847744ac37545f
---
# Webhook

Wenn Sie eine flexiblere Benachrichtigungsmethode benötigen, können Sie versuchen, benutzerdefinierte Webhooks zu verwenden, um Ihre Nachrichten zu benachrichtigen. Auf diese Weise können Sie die Benachrichtigungen von Tianji in jedes System integrieren.

### Beispielergebnis

Das Tianji-System sendet eine POST-Anfrage mit dem folgenden Beispielinhalt.

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
    "title": "Benachrichtigungstest für neue Benachrichtigung",
    "content": "Tianji: Einblicke in alles\\nDies ist ein Benachrichtigungstest von der neuen Benachrichtigung\\n[Bild]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "Tianji: Einblicke in alles"
        },
        {
            "type": "text",
            "content": "Dies ist ein Benachrichtigungstest von der neuen Benachrichtigung"
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
