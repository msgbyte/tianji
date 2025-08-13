---
sidebar_position: 4
---

# State (ongoing incidents)

Feed State models ongoing incidents with an immutable `eventId`. You can repeatedly upsert updates to the same `eventId` until it is resolved.

## Endpoints

- Upsert state (public): `POST /open/feed/{channelId}/state/upsert`
- Resolve state (auth): `POST /open/workspace/{workspaceId}/feed/{channelId}/state/resolve`
- List ongoing states (auth): `GET /open/workspace/{workspaceId}/feed/state/all?channelId=...&limit=...`

## Upsert body

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

If the channel is configured with `webhookSignature`, you must include header `x-webhook-signature`.

## Resolve example

```bash
curl -X POST \
  "$BASE_URL/workspace/$WORKSPACE_ID/feed/$CHANNEL_ID/state/resolve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stateId": "STATE_ID"}'
```
