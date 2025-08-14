---
sidebar_position: 2
_i18n_hash: f5e0cd17d30a2d7438fa8962eadfd7b5
---
# Canaux

Les canaux sont des conteneurs d'événements. Vous pouvez créer plusieurs canaux pour différents produits/équipes/environnements.

## Créer un canal

Console → Flux → Ajouter un canal.

Champs

- nom: Nom d'affichage
- notifyFrequency: Contrôle la fréquence à laquelle les notifications sont envoyées pour ce canal
- notificationIds: Sélectionnez les cibles de notification existantes pour recevoir la diffusion

## Modifier un canal

Vous pouvez mettre à jour le nom, les notificationIds, la notifyFrequency et définir une webhookSignature optionnelle. Une fois qu'une signature est définie, tout webhook public pour ce canal doit inclure l'en-tête `x-webhook-signature` avec la même valeur.

## API

- Lister les canaux : GET `/open/workspace/{workspaceId}/feed/channels`
- Infos du canal : GET `/open/workspace/{workspaceId}/feed/{channelId}/info`
- Mettre à jour : POST `/open/workspace/{workspaceId}/feed/{channelId}/update`
- Créer : POST `/open/workspace/{workspaceId}/feed/createChannel`
- Supprimer : DELETE `/open/workspace/{workspaceId}/feed/{channelId}/del`

Exemple (mettre à jour les cibles de notification)

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
