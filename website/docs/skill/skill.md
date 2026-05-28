---
sidebar_position: 1
---

# Integration with Agent Skill

## Introduction

The **Tianji Data Query Skill** is a lightweight, agent-agnostic skill bundle that lets AI agents (Cursor, Claude Code, Codex, Copilot CLI, etc.) query the Tianji platform directly through its read-only OpenAPI.

It follows the [agentskills.io](https://agentskills.io/specification) specification — a single `SKILL.md` plus reference files. No long-running process, no extra runtime.

:::tip Get started
See the [Installation Guide](./installation.md) for one-click and manual setup.
:::

**What it covers:** 69 GET endpoints across 14 service domains:

- **Website** — traffic stats, pageviews, geo distribution, Lighthouse reports
- **Monitor** — uptime status, recent check data, monitor events
- **Survey** — survey responses, result stats, AI categories
- **Telemetry** — custom event counts, telemetry pageviews, metrics
- **Feed** — channels, event streams, feed states
- **Application** — app store reviews, app info, event stats
- **Billing / AI Gateway / Worker / Page / Workspace / Global / AuditLog**

## Skill vs MCP Server

Tianji offers two ways to integrate with AI agents. Pick the one that fits your workflow:

| | Agent Skill | [MCP Server](/docs/mcp) |
|--|--|--|
| **Form** | Plain documentation files (`SKILL.md` + references) | A long-running Node.js process |
| **Runtime** | None — agent uses `curl` or built-in HTTP tools | `npx tianji-mcp-server` |
| **Coverage** | 69 GET endpoints (read-only, full surface) | A curated subset of tools (read + some write) |
| **Setup** | Drop files into the agent's skills directory | Add MCP config to the agent's config file |
| **Best for** | Cursor / Claude Code / Codex / any agent following the agentskills.io spec | Agents with first-class MCP support |

You can use both at the same time without conflict.

## Usage Examples

Once installed, you can ask your AI agent natural-language questions and it will pick the right endpoint:

### Example 1: Website traffic overview

```
User: Show me the pageviews of my main website over the past 7 days.

Agent: [Calls GET /open/workspace/{workspaceId}/website/all to find the site]
       [Then GET /open/workspace/{workspaceId}/website/{websiteId}/pageviews
        with startAt/endAt covering 7 days]
       Your main website received 12,438 pageviews over the past 7 days,
       with a peak of 2,103 on Tuesday. Top referrer: google.com (43%).
```

### Example 2: Monitor health check

```
User: Are any of my monitors down right now?

Agent: [Calls GET /open/workspace/{workspaceId}/monitor/all]
       [Then GET /open/workspace/{workspaceId}/monitor/{monitorId}/status
        for each monitor]
       2 monitors are currently DOWN:
       - api.example.com (HTTP 503, last UP 12 min ago)
       - db-replica (TCP timeout, last UP 1h ago)
       The other 8 monitors are healthy.
```

### Example 3: Survey result analysis

```
User: Summarise the responses to the "Q4 Customer Feedback" survey.

Agent: [Calls GET /open/workspace/{workspaceId}/survey/all to resolve the ID]
       [Then GET /open/workspace/{workspaceId}/survey/{surveyId}/stats]
       [Then GET /open/workspace/{workspaceId}/survey/{surveyId}/result/list
        with a pagination cursor]
       "Q4 Customer Feedback" received 218 responses. Average satisfaction
       4.3/5. Top theme: dashboard performance (mentioned 47 times). Most
       requested feature: dark mode (31 mentions).
```

## Sensitive Data Handling

Some endpoints may return platform-stored secrets (e.g. `modelApiKey`, `customModelBaseUrl` in AI Gateway responses) or PII (workspace members, audit logs, billing).

The skill instructs agents to:

- **Never display** `apiKey`, `modelApiKey`, `secret`, `token`, `password`, or `credential` fields.
- **Redact or omit** these fields when summarising responses.
- For workspace members / audit logs, only surface non-sensitive metadata (names, roles, timestamps) unless the user explicitly requests full detail.

The bundled `openapi-readonly.json` also pre-redacts these fields at the schema level, so agents cannot accidentally rely on their structure.

## Source

The skill source lives in the Tianji repository under [`skills/tianji-data-query/`](https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query). Pull requests welcome.
