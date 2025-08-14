---
sidebar_position: 5
_i18n_hash: 2ebf85a054d427b1cfc8e50c237bede0
---
# Intégrations

Tianji propose des adaptateurs de webhook intégrés pour convertir les charges utiles tierces en événements Feed.

## GitHub

Point de terminaison

POST `/open/feed/{channelId}/github`

Notes

- Utilisez le type de contenu "application/json".
- L'en-tête `X-GitHub-Event` est requis par GitHub et utilisé par l'adaptateur.
- Types pris en charge : `push`, `star`, `issues` (ouvert/fermé). Les autres seront enregistrés comme inconnus.

## Stripe

Point de terminaison

POST `/open/feed/{channelId}/stripe`

Notes

- Configurez un point de terminaison webhook Stripe pointant vers l'URL ci-dessus.
- Types pris en charge : `payment_intent.succeeded`, `payment_intent.canceled`, `customer.subscription.created`, `customer.subscription.deleted`.

## Sentry

Point de terminaison

POST `/open/feed/{channelId}/sentry`

Notes

- L'en-tête `Sentry-Hook-Resource: event_alert` et l'action `triggered` sont mappés aux événements Feed.
- Voir les captures d'écran étape par étape dans "Intégration avec Sentry".

## Alarme Tencent Cloud

Point de terminaison

POST `/open/feed/{channelId}/tencent-cloud/alarm`

Notes

- Prend en charge les types d'alarme `event` et `metric`. La charge utile est validée ; les requêtes invalides sont rejetées.

## Terrain de jeu Webhook

Point de terminaison

POST `/open/feed/playground/{workspaceId}`

Notes

- Renvoie les en-têtes/le corps/la méthode/l'URL au terrain de jeu en temps réel de l'espace de travail pour le débogage des intégrations.
