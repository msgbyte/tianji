---
sidebar_position: 5
_i18n_hash: 4ea8ae049c2d4b09f2847744ac37545f
---
# Webhook

Si vous avez besoin d'une méthode de notification plus flexible, vous pouvez essayer d'utiliser des webhooks personnalisés pour notifier vos messages. De cette manière, vous pouvez intégrer les notifications de Tianji dans n'importe quel système.

### Exemple de Résultat

Le système Tianji enverra une requête POST avec le contenu d'exemple ci-dessous.

```json
{
    "notification": {
        "workspaceId": "xxxxxxxxxxx",
        "name": "Nouvelle Notification",
        "type": "webhook",
        "payload": {
            "webhookUrl": "example.com"
        }
    },
    "title": "Test de Notification de Nouvelle Notification",
    "content": "Tianji : Insight into everything\\nCeci est un test de notification de Nouvelle Notification\\n[image]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "Tianji : Insight into everything"
        },
        {
            "type": "text",
            "content": "Ceci est un test de notification de Nouvelle Notification"
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
