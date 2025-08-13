---
sidebar_position: 0
---

# Feed overview

Feed is a lightweight event stream for your workspace. It helps teams aggregate important events from different systems into channels, collaborate around incidents, and keep stakeholders informed.

## Concepts

- Channel: A logical stream to collect and organize events. Each channel can be connected to one or more notification targets and can optionally require a webhook signature.
- Event: A single record with name, content, tags, source, sender identity, importance and optional payload. Events can be archived/unarchived.
- State: A special kind of ongoing event that can be upserted (created or updated) repeatedly by a stable eventId, and resolved when finished.
- Integration: Built-in webhook adapters that convert 3rd-party payloads (e.g. GitHub, Stripe, Sentry, Tencent Cloud Alarm) into Feed events.
- Notification: Channels can fan-out events to configured notifiers; delivery frequency can be tuned by channel settings.

## Typical use cases

- Product and infra incident stream across multiple services
- CI/CD deployment and release notices
- Billing and subscription signals
- Security, monitoring and error alerts
