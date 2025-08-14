---
sidebar_position: 4
_i18n_hash: 0a395db245537dd2e052b4525326e318
---
# Status (laufende Vorfälle)

Der Status-Feed modelliert laufende Vorfälle mit einer unveränderlichen `eventId`. Sie können wiederholt Updates zur gleichen `eventId` einfügen, bis sie gelöst ist.

## Endpunkte

- Status einfügen (öffentlich): `POST /open/feed/{channelId}/state/upsert`
- Status lösen (authentifiziert): `POST /open/workspace/{workspaceId}/feed/{channelId}/state/resolve`
- Laufende Status auflisten (authentifiziert): `GET /open/workspace/{workspaceId}/feed/state/all?channelId=...&limit=...`

## Einfügeinhalt

```json
{
  "eventId": "deploy#2025-08-12",
  "eventName": "deploy_progress",
  "eventContent": "Rollout 60%",
  "tags": ["prod"],
  "source": "ci",
  "senderId": "runner-42",
  "senderName": "GitHub Actions",
  "important": true,
  "payload": {"stage": "canary"}
}
```

Wenn der Kanal mit einer `webhookSignature` konfiguriert ist, müssen Sie den Header `x-webhook-signature` einfügen.

## Lösebeispiel

```bash
curl -X POST \
  "$BASE_URL/workspace/$WORKSPACE_ID/feed/$CHANNEL_ID/state/resolve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stateId": "STATE_ID"}'
```
