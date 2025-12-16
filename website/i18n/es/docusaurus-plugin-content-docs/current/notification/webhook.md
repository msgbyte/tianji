---
sidebar_position: 5
_i18n_hash: 4ea8ae049c2d4b09f2847744ac37545f
---
# Webhook

Si necesitas un método de notificación más flexible, puedes intentar usar webhooks personalizados para notificar tus mensajes. De esta manera, puedes integrar las notificaciones de Tianji en cualquier sistema.

### Ejemplo de Resultado

El sistema Tianji enviará una solicitud POST con el contenido del ejemplo a continuación.

```json
{
    "notification": {
        "workspaceId": "xxxxxxxxxxx",
        "name": "Nueva Notificación",
        "type": "webhook",
        "payload": {
            "webhookUrl": "example.com"
        }
    },
    "title": "Prueba de Notificación Nueva Notificación",
    "content": "Tianji: Perspectiva de todo\\nEsta es una Prueba de Notificación de Nueva Notificación\\n[imagen]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "Tianji: Perspectiva de todo"
        },
        {
            "type": "text",
            "content": "Esta es una Prueba de Notificación de Nueva Notificación"
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
