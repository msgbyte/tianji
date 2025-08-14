---
sidebar_position: 2
_i18n_hash: f5e0cd17d30a2d7438fa8962eadfd7b5
---
# Kanäle

Kanäle sind Container für Ereignisse. Sie können mehrere Kanäle für verschiedene Produkte/Teams/Umgebungen erstellen.

## Einen Kanal erstellen

Konsole → Feed → Kanal hinzufügen.

Felder

- name: Anzeigename
- notifyFrequency: Steuern, wie oft Benachrichtigungen für diesen Kanal gesendet werden
- notificationIds: Wählen Sie bestehende Benachrichtigungsziele aus, um eine Verbreitung zu erhalten

## Einen Kanal bearbeiten

Sie können Name, notificationIds, notifyFrequency aktualisieren und eine optionale webhookSignature festlegen. Sobald eine Signatur festgelegt ist, muss jeder öffentliche Webhook zu diesem Kanal die Kopfzeile `x-webhook-signature` mit demselben Wert enthalten.

## API

- Kanäle auflisten: GET `/open/workspace/{workspaceId}/feed/channels`
- Kanalinfo: GET `/open/workspace/{workspaceId}/feed/{channelId}/info`
- Aktualisieren: POST `/open/workspace/{workspaceId}/feed/{channelId}/update`
- Erstellen: POST `/open/workspace/{workspaceId}/feed/createChannel`
- Löschen: DELETE `/open/workspace/{workspaceId}/feed/{channelId}/del`

Beispiel (Benachrichtigungsziele aktualisieren)

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
