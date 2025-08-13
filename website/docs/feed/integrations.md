---
sidebar_position: 5
---

# Integrations

Tianji provides built-in webhook adapters to convert third-party payloads into Feed events.

## GitHub

Endpoint

POST `/open/feed/{channelId}/github`

Notes

- Use "application/json" content type.
- Header `X-GitHub-Event` is required by GitHub and consumed by the adapter.
- Supported types: `push`, `star`, `issues` (opened/closed). Others will be logged as unknown.

## Stripe

Endpoint

POST `/open/feed/{channelId}/stripe`

Notes

- Configure a Stripe webhook endpoint pointing to the URL above.
- Supported types: `payment_intent.succeeded`, `payment_intent.canceled`, `customer.subscription.created`, `customer.subscription.deleted`.

## Sentry

Endpoint

POST `/open/feed/{channelId}/sentry`

Notes

- Header `Sentry-Hook-Resource: event_alert` and action `triggered` are mapped to Feed events.
- See step-by-step screenshots in "Integration with Sentry".

## Tencent Cloud Alarm

Endpoint

POST `/open/feed/{channelId}/tencent-cloud/alarm`

Notes

- Supports alarm types `event` and `metric`. Payload is validated; invalid requests are rejected.

## Webhook Playground

Endpoint

POST `/open/feed/playground/{workspaceId}`

Notes

- Echo headers/body/method/url to the workspace real-time playground for debugging integrations.
