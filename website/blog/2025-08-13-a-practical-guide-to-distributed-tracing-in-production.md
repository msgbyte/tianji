---
title: 'Lightweight Telemetry: Count Visitors with Pixel and Simple Requests'
slug: lightweight-telemetry-pixel-and-simple-requests
description: 'A privacy-friendly, no-cookie approach to confirm visitor volume using a 1x1 pixel and simple requests. Learn implementation details, caching pitfalls, and how this works with Tianji.'
tags:
  - Telemetry
  - Analytics
  - Privacy
---

# Lightweight Telemetry: Count Visitors with Pixel and Simple Requests

When you just need to confirm real visitor volume without heavy SDKs, cookies, or complex pipelines, a 1x1 pixel or a minimal request is enough. Tianji supports this lightweight telemetry pattern to help you validate traffic safely and reliably.

[![minimal analytics dashboard](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&q=80&w=1200&fit=max)](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&q=80&w=1200&fit=max)

## What This Telemetry Is (and Is Not)

- It is a simple “signal” that a human likely visited a page or executed an action.
- It is not OpenTelemetry, tracing, or deep behavioral analytics.
- It favors privacy and performance over granularity.

Common use cases:

- Confirming documentation traffic and marketing landing page reach
- Basic pageview counting for self-hosted sites
- Minimal conversion confirmation (e.g., signup success page)

## Option 1: Image Pixel (No JavaScript)

Embed a 1x1 pixel that calls your collector endpoint. The server increments counters based on request metadata.

```html
<!-- Simple pixel beacon: uses GET and works without JS -->
<img
  src="https://your-domain.example/api/telemetry/pixel?site=docs&path=/getting-started&ts=1690000000000"
  width="1"
  height="1"
  alt=""
  referrerpolicy="strict-origin-when-cross-origin"
  loading="eager"
/>
```

Server recommendations:

- Count unique visits by a rolling fingerprint from IP range + User-Agent + truncated time bucket
- Return `Cache-Control: no-store` to avoid CDN/browser caching
- Use `204 No Content` and a tiny transparent GIF/PNG if needed

[![network cables representing lightweight transport](https://images.unsplash.com/photo-1518781780548-4d410d94ec75?auto=format&q=80&w=1200&fit=max)](https://images.unsplash.com/photo-1518781780548-4d410d94ec75?auto=format&q=80&w=1200&fit=max)

## Option 2: Minimal Request (sendBeacon/fetch)

When JavaScript is available, a tiny request provides more control and better delivery on page unload.

```html
<script>
  // Use sendBeacon when available to improve delivery on unload
  (function () {
    var url = 'https://your-domain.example/api/telemetry/hit';
    var payload = JSON.stringify({ site: 'docs', path: location.pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, payload);
    } else {
      // Fallback: fire-and-forget fetch
      fetch(url, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      });
    }
  })();
  // Note: No cookies, no localStorage. Keep it privacy-friendly.
</script>
```

Server recommendations:

- Accept both `POST` (JSON) and `GET` (query) to handle blockers
- Normalize UA strings and drop high-cardinality parameters
- Apply bot heuristics and basic rate limits

## Avoiding Caching Pitfalls

- Add `Cache-Control: no-store` and `Pragma: no-cache` on responses
- For pixel GETs, include a timestamp `ts=<epoch>` to bust intermediary caches
- On CDNs, bypass cache for `/api/telemetry/*` paths

[![analytics graphs on screen](https://images.unsplash.com/photo-1615992174118-9b8e9be025e7?auto=format&q=80&w=1200&fit=max)](https://images.unsplash.com/photo-1615992174118-9b8e9be025e7?auto=format&q=80&w=1200&fit=max)

## What You Can Measure Reliably

- Pageviews and unique visitors (coarse, privacy-preserving)
- Per-path popularity (docs, blog posts, landing pages)
- Simple conversions (e.g., reached thank-you page)

What you should not infer:

- Precise user identity or cross-device journeys
- Detailed event streams or UI heatmaps

## How This Works with Tianji

- Use the pixel or minimal request to send pageview signals into Tianji
- Correlate traffic with uptime, response time, and incidents in a single view
- Keep data ownership: self-hosted, lightweight, and privacy-aware

Useful docs:

- Telemetry intro: https://tianji.msgbyte.com/docs/telemetry/intro
- Website tracking script: https://tianji.msgbyte.com/docs/website/track-script
- Feed concepts: /docs/feed/intro, /docs/feed/state, /docs/feed/channels

[![team aligning around a simple plan](https://images.unsplash.com/photo-1536408614573-c49fd217cd3b?auto=format&q=80&w=1200&fit=max)](https://images.unsplash.com/photo-1536408614573-c49fd217cd3b?auto=format&q=80&w=1200&fit=max)

## Key Takeaways

1. A 1x1 pixel or a tiny request is enough to confirm real visitor volume.
2. Prefer privacy-friendly defaults: no cookies, no local storage, no PII.
3. Control caching aggressively to avoid undercounting.
4. Use sendBeacon/fetch for reliability; fall back to pixel when JS is blocked.
5. Pipe signals into Tianji to see traffic alongside uptime and performance.

Lightweight telemetry gives you the truth you need—no more, no less—while keeping users fast and private.
