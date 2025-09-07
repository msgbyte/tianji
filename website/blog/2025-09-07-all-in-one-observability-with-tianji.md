---
title: "One Stack for Website Analytics, Uptime, and Server Health: All‑in‑One Observability with Tianji"
slug: all-in-one-observability-with-tianji
description: "Connect Website Analytics, Uptime Monitor, and Server Status into one lightweight, decision‑ready observability surface."
tags:
  - Tianji
  - Analytics
  - Uptime
  - Server Status
  - SRE
  - Self-host
---

# One Stack for Website Analytics, Uptime, and Server Health: All‑in‑One Observability with Tianji

[![analytics dashboard](https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200)](https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&q=85)

When you put product analytics, uptime monitoring, and server health on the same observability surface, you find issues faster, iterate more confidently, and make the right calls within privacy and compliance boundaries. Tianji combines `Website Analytics` + `Uptime Monitor` + `Server Status` into one platform, giving teams end‑to‑end insights with a lightweight setup.

## Why an all‑in‑one observability layer

- **Fewer context switches**: From traffic to availability without hopping across tools.
- **Unified semantics**: One set of events and dimensions; metrics connect across layers.
- **Privacy‑first**: Cookie‑less by default, with IP truncation, minimization, and aggregation.
- **Self‑hosting optional**: Clear boundaries to meet compliance and data residency needs.

[![privacy lock](https://images.unsplash.com/photo-1608411197659-136d2926de6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200)](https://images.unsplash.com/photo-1608411197659-136d2926de6e?crop=entropy&cs=srgb&fm=jpg&q=85)

## The signals you actually need

- **Product analytics**: Pageviews, sessions, referrers/UTM, conversions and drop‑offs on critical paths.
- **Uptime monitoring**: Reachability, latency, error rates; sliced by region and ISP.
- **Server health**: CPU/memory/disk/network essentials with threshold‑based alerts.
- **Notification & collaboration**: Route via Webhook/Slack/Telegram, with noise control.

## How Tianji delivers it

Tianji ships three capabilities in one platform:

1. **Website analytics**: Lightweight script, cookie‑less collection; default aggregation and retention policies.
2. **Uptime monitoring**: Passive/active compatible, with built‑in status pages and regional views.
3. **Server status**: Unified reporting and visualization; open APIs for audits and export.

Privacy by design is on by default: IP truncation, geo mapping, and minimal storage, with options for self‑hosting and region‑pinned deployments.

## 3‑minute quickstart

```bash
wget https://raw.githubusercontent.com/msgbyte/tianji/master/docker-compose.yml
docker compose up -d
```

The default account is `admin`/`admin`. Change the password promptly and set up your first site and monitors.

## Common rollout patterns

[![server lights](https://images.unsplash.com/photo-1668886579868-ad8b5ad88dc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200)](https://images.unsplash.com/photo-1668886579868-ad8b5ad88dc8?crop=entropy&cs=srgb&fm=jpg&q=85)

- **Small teams/indies**: Single‑host self‑deployment with out‑of‑the‑box end‑to‑end signals.
- **Mid‑size SaaS**: Consolidate funnels, SLAs, and server alerts into a single alerting layer to cut false positives.
- **Open‑source self‑host**: Public status pages outside, fine‑grained metrics and audit‑friendly exports inside.

## Best‑practice checklist

- Define 3–5 critical funnels and track only decision‑relevant events.
- Enable IP truncation and set retention (e.g., 30 days for raw events, 180 days for aggregates).
- Use referrer/UTM cohorts for growth analysis; avoid individual identification.
- Separate public status pages from internal alerts to reduce exposure.
- Review monthly: decision value vs. data cost — trim aggressively.

## Closing

Seeing product and reliability on the same canvas is a more efficient way to collaborate. With Tianji, teams get fewer‑noise, action‑ready signals — all with privacy and compliance first.
