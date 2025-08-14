---
sidebar_position: 5
_i18n_hash: 2ebf85a054d427b1cfc8e50c237bede0
---
# Integrationen

Tianji bietet integrierte Webhook-Adapter, um Drittanbieter-Payloads in Feed-Ereignisse umzuwandeln.

## GitHub

Endpoint

POST `/open/feed/{channelId}/github`

Anmerkungen

- Verwenden Sie den Inhaltstyp "application/json".
- Der Header `X-GitHub-Event` ist erforderlich von GitHub und wird vom Adapter verarbeitet.
- Unterstützte Typen: `push`, `star`, `issues` (geöffnet/geschlossen). Andere werden als unbekannt protokolliert.

## Stripe

Endpoint

POST `/open/feed/{channelId}/stripe`

Anmerkungen

- Konfigurieren Sie einen Stripe-Webhook-Endpoint, der auf die obige URL zeigt.
- Unterstützte Typen: `payment_intent.succeeded`, `payment_intent.canceled`, `customer.subscription.created`, `customer.subscription.deleted`.

## Sentry

Endpoint

POST `/open/feed/{channelId}/sentry`

Anmerkungen

- Der Header `Sentry-Hook-Resource: event_alert` und die Aktion `triggered` werden auf Feed-Ereignisse abgebildet.
- Siehe Schritt-für-Schritt-Screenshots in "Integration mit Sentry".

## Tencent Cloud Alarm

Endpoint

POST `/open/feed/{channelId}/tencent-cloud/alarm`

Anmerkungen

- Unterstützt Alarmtypen `event` und `metric`. Payload wird validiert; ungültige Anfragen werden abgelehnt.

## Webhook Playground

Endpoint

POST `/open/feed/playground/{workspaceId}`

Anmerkungen

- Echo-Header/Körper/Methode/URL an den Echtzeit-Arbeitsbereichs-Playground zur Fehlersuche bei Integrationen.
