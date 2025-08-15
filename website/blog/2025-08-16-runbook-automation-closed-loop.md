---
title: 'Runbook Automation: Connect Detection → Diagnosis → Repair into a Closed Loop (Powered by a Unified Incident Timeline)'
slug: runbook-automation-closed-loop-with-unified-timeline
description: 'Connect monitoring signals, events, and response actions into a closed loop: use a unified incident timeline to drive runbook automation for faster detection-to-repair (with Tianji).'
tags:
  - Observability
  - Incident Response
  - Automation
  - SRE
---

# Runbook Automation: Connect Detection → Diagnosis → Repair into a Closed Loop (Powered by a Unified Incident Timeline)

[![monitoring dashboards](https://images.unsplash.com/photo-1636868240132-442d20fd00e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3OTE0MDh8MHwxfHNlYXJjaHwyfHxtb25pdG9yaW5nJTIwZGFzaGJvYXJkJTIwc2NyZWVuc3xlbnwwfDB8fHwxNzU1MjgzNzY1fDA&ixlib=rb-4.1.0&q=80&w=1080)](https://images.unsplash.com/photo-1636868240132-442d20fd00e7?crop=entropy&cs=srgb&fm=jpg&q=85)

“The alert fired—now what?” For many teams, the pain is not “Do we have monitoring?” but “How many people, tools, and context switches does it take to get from detection to repair?” This article uses a unified incident timeline as the backbone to connect detection → diagnosis → repair into an automated closed loop, so on-call SREs can focus on judgment rather than tab juggling.

## Why build a closed loop

Without a unified context, three common issues plague response workflows:

- Fragmented signals: metrics, logs, traces, and synthetic flows are split across tools.
- Slow handoffs: alerts lack diagnostic context, causing repeated pings and evidence gathering.
- Inconsistent actions: fixes are ad hoc; best practices don’t accumulate as reusable runbooks.

Closed-loop automation makes the “signals → decisions → actions” chain stable, auditable, and replayable by using a unified timeline as the spine.

## How a unified incident timeline carries the response

[![control room comms](https://images.unsplash.com/photo-1631006732121-a6da2f4864d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3OTE0MDh8MHwxfHNlYXJjaHw0fHxjb250cm9sJTIwcm9vbSUyMG1vbml0b3JpbmclMjBkYXNoYm9hcmR8ZW58MHwwfHx8MTc1NTI4MzcxMnww&ixlib=rb-4.1.0&q=80&w=1080)](https://images.unsplash.com/photo-1631006732121-a6da2f4864d3?crop=entropy&cs=srgb&fm=jpg&q=85)

Key properties of the unified timeline:

1. Correlation rules fold multi-source signals of the same root cause into one incident, avoiding alert storms.
2. Each incident is auto-enriched with context (recent deploys, SLO burn, dependency health, hot metrics).
3. Response actions (diagnostic scripts, rollback, scale-out, traffic shifting) are recorded on the same timeline for review and continuous improvement.

## Five levels of runbook automation

[![server room cables](https://images.unsplash.com/photo-1691435828932-911a7801adfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3OTE0MDh8MHwxfHNlYXJjaHwyfHxzZXJ2ZXIlMjByb29tJTIwY2FibGVzfGVufDB8MHx8fDE3NTUyODM3Njd8MA&ixlib=rb-4.1.0&q=80&w=1080)](https://images.unsplash.com/photo-1691435828932-911a7801adfb?crop=entropy&cs=srgb&fm=jpg&q=85)

An evolution path from prompts to autonomy:

1. Human-in-the-loop visualization: link charts and log slices on the timeline to cut context switching.
2. Guided semi-automation: run diagnostic scripts on incident start (dependencies, thread dumps, slow queries).
3. Conditional actions: execute low-risk fixes (rollback/scale/shift) behind guard conditions.
4. Policy-driven orchestration: adapt by SLO burn, release windows, and dependency health.
5. Guardrailed autonomy: self-heal within boundaries; escalate to humans beyond limits.

## Automation is not “more scripts,” it’s “better triggers”

[![self-healing automation concept](https://images.unsplash.com/photo-1705245342510-3bde061ac4cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3OTE0MDh8MHwxfHNlYXJjaHwxfHxzZWxmJTIwaGVhbGluZyUyMHN5c3RlbXMlMjBhdXRvbWF0aW9ufGVufDB8MHx8fDE3NTUyODM3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080)](https://images.unsplash.com/photo-1705245342510-3bde061ac4cb?crop=entropy&cs=srgb&fm=jpg&q=85)

High-quality triggers stem from high-quality signal design:

- Anchor on SLOs: prioritize strong triggers on budget burn and user-impacting paths.
- Adaptive sampling: full on failure paths, lower in steady state, temporary boosts after deploys.
- Event folding: compress cascades (DB down → API 5xx → frontend errors) into a single incident so scripts don’t compete.

## A practical Detection → Repair pattern

[![night collaboration](https://images.unsplash.com/photo-1701201357867-5b3b8c3f541a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3OTE0MDh8MHwxfHNlYXJjaHw0fHxlbmdpbmVlcmluZyUyMHRlYW0lMjBjb2xsYWJvcmF0aW9uJTIwbmlnaHQlMjBvcGVyYXRpb25zfGVufDB8MHx8fDE3NTUyODM3Njl8MA&ixlib=rb-4.1.0&q=80&w=1080)](https://images.unsplash.com/photo-1701201357867-5b3b8c3f541a?crop=entropy&cs=srgb&fm=jpg&q=85)

1. Detect: synthetic flows or external probes fail on user-visible paths.
2. Correlate: fold related signals on one timeline; auto-escalate when SLO thresholds are at risk.
3. Diagnose: run scripts in parallel for dependency health, recent deploys, slow queries, hot keys, and thread stacks.
4. Repair: if guard conditions pass, execute rollback/scale/shift/restart on scoped units; otherwise require human approval.
5. Review: actions, evidence, and outcomes live on the same timeline to improve the next response.

## Implement quickly with Tianji

- Unified Feed aggregates checks, metrics, and events in one place for timeline correlation and folding: see [Feed State Model](/docs/feed/state) and [Channels](/docs/feed/channels).
- Lightweight server status reporting for key host metrics in minutes: see [Server Status Reporter](/docs/server-status/server-status-reporter).
- Open product and event telemetry: see [Telemetry Intro](/docs/telemetry/intro) and [Website Tracking Script](/docs/website/track-script).
- Custom monitors and synthetic flows on high-value paths, with policy-based sampling and automated actions: see [Custom Script Monitor](/docs/monitor/custom-script).

## Implementation checklist (check as you go)

- Map critical user journeys and SLOs; define guard conditions for safe automation
- Ingest checks, metrics, deploys, dependencies, and product events into a single timeline
- Build a library of diagnostic scripts and low-risk repair actions
- Configure incident folding and escalation to avoid alert storms
- Switch sampling and thresholds across release windows and traffic peaks/valleys
- After each incident, push more steps into automation with guardrails

## Closing thoughts

Runbook automation is not “shipping a giant orchestrator in one go.” It starts with a unified timeline and turns common response paths into workflows that are visible, executable, verifiable, and evolvable. With Tianji’s open building blocks, you can safely delegate repetitive work to automation and keep human focus on real decisions.
