---
sidebar_position: 2
---

# Channels

Channels are containers of events. You can create multiple channels for different products/teams/environments.

## Create a channel

Console → Feed → Add Channel.

Fields

- name: Display name
- notifyFrequency: Control how often notifications are sent for this channel
- notificationIds: Select existing notification targets to receive fan-out

## Edit a channel

You can update name, notificationIds, notifyFrequency, and set an optional webhookSignature. Once a signature is set, any public webhook to this channel must include header `x-webhook-signature` with the same value.

## API

- List channels: GET `/open/workspace/{workspaceId}/feed/channels`
- Channel info: GET `/open/workspace/{workspaceId}/feed/{channelId}/info`
- Update: POST `/open/workspace/{workspaceId}/feed/{channelId}/update`
- Create: POST `/open/workspace/{workspaceId}/feed/createChannel`
- Delete: DELETE `/open/workspace/{workspaceId}/feed/{channelId}/del`

Example (update notification targets)

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
