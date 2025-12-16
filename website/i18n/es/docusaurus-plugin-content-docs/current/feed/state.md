---
sidebar_position: 4
_i18n_hash: 0a395db245537dd2e052b4525326e318
---
# Estado (incidentes en curso)

El modelo de Estado gestiona incidentes en curso con un `eventId` inmutable. Puedes actualizar repetidamente el mismo `eventId` hasta que se resuelva.

## Endpoints

- Insertar/Actualizar estado (público): `POST /open/feed/{channelId}/state/upsert`
- Resolver estado (autenticar): `POST /open/workspace/{workspaceId}/feed/{channelId}/state/resolve`
- Listar estados en curso (autenticar): `GET /open/workspace/{workspaceId}/feed/state/all?channelId=...&limit=...`

## Cuerpo de actualización

```json
{
  "eventId": "deploy#2025-08-12",
  "eventName": "deploy_progress",
  "eventContent": "Despliegue 60%",
  "tags": ["prod"],
  "source": "ci",
  "senderId": "runner-42",
  "senderName": "GitHub Actions",
  "important": true,
  "payload": {"stage": "canary"}
}
```

Si el canal está configurado con `webhookSignature`, debes incluir el encabezado `x-webhook-signature`.

## Ejemplo de resolución

```bash
curl -X POST \
  "$BASE_URL/workspace/$WORKSPACE_ID/feed/$CHANNEL_ID/state/resolve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stateId": "STATE_ID"}'
```
