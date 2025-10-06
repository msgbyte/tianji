---
sidebar_position: 4
_i18n_hash: 0a395db245537dd2e052b4525326e318
---
# Status (insiden yang sedang berlangsung)

Model Status memberikan insiden yang sedang berlangsung dengan `eventId` yang tetap. Anda dapat mengubah atau menambahkan pembaruan secara berulang ke `eventId` yang sama hingga insiden tersebut diselesaikan.

## Endpoint

- Upsert status (publik): `POST /open/feed/{channelId}/state/upsert`
- Selesaikan status (auth): `POST /open/workspace/{workspaceId}/feed/{channelId}/state/resolve`
- Daftar status yang sedang berlangsung (auth): `GET /open/workspace/{workspaceId}/feed/state/all?channelId=...&limit=...`

## Badan Upsert

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

Jika saluran dikonfigurasi dengan `webhookSignature`, Anda harus menyertakan header `x-webhook-signature`.

## Contoh Menyelesaikan

```bash
curl -X POST \
  "$BASE_URL/workspace/$WORKSPACE_ID/feed/$CHANNEL_ID/state/resolve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stateId": "STATE_ID"}'
```
