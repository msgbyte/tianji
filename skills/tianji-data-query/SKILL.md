---
name: tianji-data-query
description: >
  Use when the user asks about website traffic, pageviews, monitor status,
  survey feedback, telemetry events, feed channels, billing usage,
  application stats, or other Tianji platform data through read-only queries.
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

Before querying data, fetch and read the **target instance's** OpenAPI document. `TIANJI_BASE_URL` is the instance URL without the `/open` suffix:

```bash
curl --fail-with-body --silent --show-error \
  "${TIANJI_BASE_URL%/}/open/_document"
```

Confirm a successful response containing an OpenAPI JSON object with `openapi` and `paths`, not HTML or an error payload. If discovery fails, report the failure and stop API queries; do not substitute bundled paths or guess endpoints. The instance must enable OpenAPI to serve this document.

Use the live document to confirm the operation's method, path, path/query parameters, response schema, and authentication. Resolve referenced schemas (`$ref`), including required fields, types, formats, defaults, enums, and pagination. Resolve `servers` against the target instance before appending an operation path (normally `/open`; do not add it twice). Keep authenticated requests on the intended instance and send the API key via `Authorization: Bearer ...`, never in the URL or output.

**Only GET requests are allowed**, even though the live document also describes writes. If the requested operation has no exported GET route, report that limitation. Do not derive `/open` routes from dashboard tRPC procedures; those need separate maintained references and are outside this skill.

The target document takes precedence over bundled references and examples. Reuse it within the same task and target; fetch again after switching instances, an upgrade, or a schema-related failure. Parse successful API responses as JSON and report HTTP/API errors rather than treating them as query results.

## Service Domains

[api-endpoints.md](references/api-endpoints.md) and [openapi-readonly.json](references/openapi-readonly.json) are bundled snapshots for discovering likely operations. Their endpoint counts and schemas may differ from the target; confirm every selected operation against its live document.

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
2. Read the target's `/open/_document` and find the relevant exported GET operation; bundled references are lookup hints only
3. Construct the GET request using the live path and parameter schemas, actual resource IDs, and required authentication
4. Parse the JSON response, redact sensitive fields, and summarize for the user

## Common Scenarios

The routes below illustrate the bundled version. Confirm paths, parameters, timestamp formats, and pagination against the target document before using them.

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
- Live schemas and API responses are not redacted by the bundled schema's filtering; always apply these rules yourself
- NEVER display `modelApiKey`, `apiKey`, `secret`, `token`, `password`, or `credential` fields to the user
- Redact or omit these fields when summarizing API responses
- When querying workspace members or audit logs, only surface non-sensitive metadata (names, roles, timestamps) unless the user explicitly requests full detail

## Notes

- Use timestamp formats and metric `type` enums from the target operation; bundled examples use milliseconds since epoch
- Follow the target operation's pagination contract; some endpoints use `cursor` and return `nextCursor`
