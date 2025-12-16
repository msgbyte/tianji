---
sidebar_position: 2
_i18n_hash: f5e0cd17d30a2d7438fa8962eadfd7b5
---
# Canales

Los canales son contenedores de eventos. Puedes crear múltiples canales para diferentes productos/equipos/entornos.

## Crear un canal

Consola → Feed → Añadir canal.

Campos

- nombre: Nombre para mostrar
- notifyFrequency: Controla con qué frecuencia se envían las notificaciones para este canal
- notificationIds: Selecciona destinos de notificación existentes para recibir distribución

## Editar un canal

Puedes actualizar el nombre, notificationIds, notifyFrequency, y establecer un webhookSignature opcional. Una vez establecida una firma, cualquier webhook público a este canal debe incluir el encabezado `x-webhook-signature` con el mismo valor.

## API

- Listar canales: GET `/open/workspace/{workspaceId}/feed/channels`
- Información del canal: GET `/open/workspace/{workspaceId}/feed/{channelId}/info`
- Actualizar: POST `/open/workspace/{workspaceId}/feed/{channelId}/update`
- Crear: POST `/open/workspace/{workspaceId}/feed/createChannel`
- Eliminar: DELETE `/open/workspace/{workspaceId}/feed/{channelId}/del`

Ejemplo (actualizar destinos de notificación)

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
