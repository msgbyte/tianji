---
title: "Privacy‑first Website Analytics, Without the Creepiness"
slug: privacy-first-website-analytics-tianji
description: "Cookie‑less, IP‑anonymized analytics that respects users yet keeps your product decisions sharp — powered by Tianji."
tags:
  - Analytics
  - Privacy
  - Compliance
  - Self‑host
  - Tianji
---

# Privacy‑first Website Analytics, Without the Creepiness

[![privacy lock and data](https://images.unsplash.com/photo-1614064642261-3ccbfafa481b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200)](https://images.unsplash.com/photo-1614064642261-3ccbfafa481b?crop=entropy&cs=srgb&fm=jpg&q=85)

Most teams want trustworthy product signals without shadow‑tracking their users. This post outlines how to run a privacy‑first analytics stack that is cookie‑less, IP‑anonymized, and compliant by default — and how Tianji helps you ship that in minutes.

## What “privacy‑first” really means

- No third‑party cookies or fingerprinting
- IP and geo anonymization at ingestion time
- Minimization and aggregation by default (store only what you act on)
- Short retention windows with configurable TTLs
- Clear data governance: self‑hosted or region‑pinned

[![you are being watched vs privacy](https://images.unsplash.com/photo-1534157327728-accacabda257?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200)](https://images.unsplash.com/photo-1534157327728-accacabda257?crop=entropy&cs=srgb&fm=jpg&q=85)

Privacy is not the absence of insight. It is the discipline to collect the minimum, aggregate early, and keep identities out of the loop unless users explicitly consent.

## What you still get (and need) for product decisions

[![analytics dashboards](https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200)](https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&q=85)

- Page views, sessions, referrers, UTM cohorts (sans cookies)
- Conversion funnels and drop‑offs on critical paths
- Lightweight event telemetry for product behaviors
- Country/region trends with differential privacy techniques
- Content insights that help editorial and SEO without tracking people

## How Tianji implements privacy by design

Tianji bundles `Website Analytics` + `Uptime Monitor` + `Server Status` into one platform, so you get product and reliability signals together — without data sprawl.

1. Cookie‑less tracking script with hashing and salt rotation
2. IP truncation and geo mapping via in‑house database
3. Aggregation and TTL policies at the storage layer
4. Self‑host, air‑gapped, or region‑pinned deployments
5. Open APIs and export for audits

See docs: [Website Tracking Script](/docs/website/track-script), [Telemetry Intro](/docs/telemetry/intro), and [Server Status Reporter](/docs/server-status/server-status-reporter).

## Deployment options (pick your trust boundary)

[![on‑prem server lights](https://images.unsplash.com/photo-1556607356-d6a622ea735f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200)](https://images.unsplash.com/photo-1556607356-d6a622ea735f?crop=entropy&cs=srgb&fm=jpg&q=85)

- Self‑host with Docker Compose for full data control
- Region‑pinned cloud install if you prefer managed ops
- Hybrid: analytics in‑house, public status pages outside

Install in minutes:

```bash
wget https://raw.githubusercontent.com/msgbyte/tianji/master/docker-compose.yml
docker compose up -d
```

Default account is `admin`/`admin` — remember to change the password.

## Policy templates you can copy

Use these defaults to start, then tighten as needed:

- Retention: 30 days for raw events, 180 days for aggregates
- IP handling: drop last 2 octets (IPv4) or /64 (IPv6)
- PII: deny‑list at ingestion; allow only hashed user IDs under consent
- Geography: pin storage to your primary user region
- Access: least privilege with audit logging enabled

## Implementation checklist

- Map your product’s critical funnels and decide what to measure
- Deploy Tianji with cookie‑less website tracking and telemetry events
- Turn on IP truncation, geo anonymization, and retention TTLs
- Build cohorts by campaign and page groups, not people
- Review monthly: decision value vs. data cost — trim aggressively

## Closing

[![privacy culture](https://images.unsplash.com/photo-1576297185621-93ed9df5ca9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200)](https://images.unsplash.com/photo-1576297185621-93ed9df5ca9a?crop=entropy&cs=srgb&fm=jpg&q=85)

Privacy‑first analytics is not just possible — it’s the default you should expect. With Tianji, you get actionable product and reliability signals without surveilling users. Less creepiness, more clarity.
