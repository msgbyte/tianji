---
sidebar_position: 4
_i18n_hash: 0a395db245537dd2e052b4525326e318
---
# Statut (incidents en cours)

Le modèle d'état gère les incidents en cours avec un `eventId` immuable. Vous pouvez mettre à jour de manière répétée le même `eventId` jusqu'à ce qu'il soit résolu.

## Points de terminaison

- Mettre à jour l'état (public) : `POST /open/feed/{channelId}/state/upsert`
- Résoudre l'état (auth) : `POST /open/workspace/{workspaceId}/feed/{channelId}/state/resolve`
- Lister les états en cours (auth) : `GET /open/workspace/{workspaceId}/feed/state/all?channelId=...&limit=...`

## Corps de mise à jour

```json
{
  "eventId": "deploy#2025-08-12",
  "eventName": "deploy_progress",
  "eventContent": "Déploiement à 60%",
  "tags": ["prod"],
  "source": "ci",
  "senderId": "runner-42",
  "senderName": "GitHub Actions",
  "important": true,
  "payload": {"stage": "canary"}
}
```

Si le canal est configuré avec `webhookSignature`, vous devez inclure l'en-tête `x-webhook-signature`.

## Exemple de résolution

```bash
curl -X POST \
  "$BASE_URL/workspace/$WORKSPACE_ID/feed/$CHANNEL_ID/state/resolve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stateId": "STATE_ID"}'
```
