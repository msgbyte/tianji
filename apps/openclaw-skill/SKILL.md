---
name: tianji
description: >
  Query website analytics, monitor uptime, survey results, telemetry data,
  feed events, application stats, and more from the Tianji platform via its
  read-only OpenAPI (69 GET endpoints across 14 service domains).
  Use when the user asks about website traffic, pageviews, monitor status,
  survey feedback, telemetry events, feed channels, billing usage,
  or any Tianji platform data.
---

# Tianji Analytics

Query any read-only data from the Tianji monitoring and analytics platform.

## Configuration

Three values are required (provided via skill config):

| Variable | Description |
|----------|-------------|
| `TIANJI_BASE_URL` | Tianji instance URL (e.g. `https://tianji.example.com`) |
| `TIANJI_API_KEY` | API key for authentication |
| `TIANJI_WORKSPACE_ID` | Default workspace ID |

## Making API Requests

All endpoints are under `{TIANJI_BASE_URL}/open` and require a Bearer token:

```bash
curl -H "Authorization: Bearer {TIANJI_API_KEY}" \
  "{TIANJI_BASE_URL}/open/workspace/{TIANJI_WORKSPACE_ID}/website/all"
```

Only GET requests are allowed. All responses are JSON.

## Service Domains

Find the exact endpoint and parameters in [api-endpoints.md](references/api-endpoints.md).
For full parameter schemas, consult [openapi-readonly.json](references/openapi-readonly.json).

| Domain | Endpoints | Typical Questions |
|--------|-----------|-------------------|
| **Website** | 13 | Traffic stats, pageviews, geo distribution, Lighthouse scores |
| **Monitor** | 9 | Uptime status, recent check data, monitor events |
| **Survey** | 8 | Survey responses, result stats, AI categories |
| **Telemetry** | 7 | Custom event counts, telemetry pageviews, metrics |
| **Billing** | 7 | Usage quotas, subscription tier, credit balance |
| **Feed** | 6 | Feed channels, event streams, feed states |
| **Application** | 5 | App store reviews, app info, event stats |
| **AI/AIGateway** | 5 | Gateway logs, model pricing, quota alerts |
| **Worker** | 3 | Worker list, worker details, revisions |
| **Page** | 2 | Status pages |
| **Workspace** | 2 | Members, service counts |
| **Global** | 1 | Platform configuration |
| **AuditLog** | 1 | Audit trail |

## Workflow

1. Identify the service domain from the user's question
2. Read [api-endpoints.md](references/api-endpoints.md) to find the endpoint
3. Construct the GET request with required path/query parameters
4. Parse the JSON response and summarize for the user

## Common Scenarios

### Website traffic overview

```
GET /open/workspace/{workspaceId}/website/all
```
Pick the target website ID, then:
```
GET /open/workspace/{workspaceId}/website/{websiteId}/stats?startAt={timestamp}&endAt={timestamp}
```

### Monitor health check

```
GET /open/workspace/{workspaceId}/monitor/all
```
Pick the target monitor ID, then:
```
GET /open/workspace/{workspaceId}/monitor/{monitorId}/get
GET /open/workspace/{workspaceId}/monitor/{monitorId}/status
```

### Survey results analysis

```
GET /open/workspace/{workspaceId}/survey/all
```
Pick the target survey ID, then:
```
GET /open/workspace/{workspaceId}/survey/{surveyId}/result/list?startAt={timestamp}&endAt={timestamp}&limit=50
GET /open/workspace/{workspaceId}/survey/{surveyId}/stats?startAt={timestamp}&endAt={timestamp}
```

### Feed event inspection

```
GET /open/workspace/{workspaceId}/feed/channels
```
Pick the channel ID, then:
```
GET /open/workspace/{workspaceId}/feed/{channelId}/fetchEventsByCursor?limit=20
```

## Sensitive Data Handling

Some GET endpoints may return fields containing platform-stored secrets (e.g. `modelApiKey`,
`customModelBaseUrl` in AI Gateway responses). Additionally, endpoints like workspace members,
audit logs, and billing may contain PII or internal details.

**Rules:**
- NEVER display `modelApiKey`, `apiKey`, `secret`, `token`, `password`, or `credential` fields to the user
- Redact or omit these fields when summarizing API responses
- When querying workspace members or audit logs, only surface non-sensitive metadata (names, roles, timestamps) unless the user explicitly requests full detail

## Notes

- Timestamps use milliseconds since epoch (e.g. `1704067200000` for 2024-01-01)
- Pagination: some endpoints use `cursor` parameter; check the response for `nextCursor`
- The `type` parameter in website metrics accepts: `url`, `language`, `referrer`, `title`, `browser`, `os`, `device`, `country`, `event`
