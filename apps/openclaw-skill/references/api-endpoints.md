# Tianji API Endpoints (GET-only)

Base path: `{TIANJI_BASE_URL}/open`
Auth: `Authorization: Bearer {TIANJI_API_KEY}`
Timestamps: milliseconds since epoch (e.g. `1704067200000`)

---

## Website (13)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /workspace/{workspaceId}/website/{websiteId}/onlineCount` | Get online count | — |
| `GET /workspace/{workspaceId}/website/all` | Get all websites | — |
| `GET /workspace/{workspaceId}/website/allOverview` | Get overview | — |
| `GET /workspace/{workspaceId}/website/{websiteId}/info` | Get website info | — |
| `GET /workspace/{workspaceId}/website/{websiteId}/stats` | Get stats | `startAt (query)`, `endAt (query)`, `unit? (query)`, `url? (query)`, `country? (query)`, `region? (query)`, `city? (query)`, `timezone? (query)`, `referrer? (query)`, `title? (query)`, `os? (query)`, `browser? (query)`, `device? (query)` |
| `GET /workspace/{workspaceId}/website/{websiteId}/geoStats` | Get geo stats | `startAt (query)`, `endAt (query)` |
| `GET /workspace/{workspaceId}/website/{websiteId}/pageviews` | Get pageviews | `startAt (query)`, `endAt (query)`, `unit? (query)`, `url? (query)`, `country? (query)`, `region? (query)`, `city? (query)`, `timezone? (query)`, `referrer? (query)`, `title? (query)`, `os? (query)`, `browser? (query)`, `device? (query)` |
| `GET /workspace/{workspaceId}/website/{websiteId}/metrics` | Get metrics | `type (query) enum:url|language|referrer|title|browser|os|device|country|event|utm_source|utm_medium|utm_campaign|utm_term|utm_content`, `startAt (query)`, `endAt (query)`, `url? (query)`, `referrer? (query)`, `title? (query)`, `os? (query)`, `browser? (query)`, `device? (query)`, `country? (query)`, `region? (query)`, `city? (query)`, `language? (query)`, `event? (query)`, `utm_source? (query)`, `utm_medium? (query)`, `utm_campaign? (query)`, `utm_term? (query)`, `utm_content? (query)` |
| `GET /workspace/{workspaceId}/website/{websiteId}/getLighthouseReport` | Get Lighthouse report | `limit? (query) default:10`, `cursor? (query)` |
| `GET /lighthouse/{lighthouseId}` | Get Lighthouse JSON | — |
| `GET /website/public/{shareId}/info` | Get public info | — |
| `GET /website/public/{shareId}/stats` | Get public stats | `range? (query) enum:realtime|24h|7d|30d|90d default:24h` |
| `GET /website/public/{shareId}/metrics` | Get public metrics | `type (query) enum:url|language|referrer|title|browser|os|device|country|event|utm_source|utm_medium|utm_campaign|utm_term|utm_content`, `range? (query) enum:realtime|24h|7d|30d|90d default:24h` |

## Monitor (9)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /workspace/{workspaceId}/monitor/all` | Get all monitors | — |
| `GET /workspace/{workspaceId}/monitor/{monitorId}/get` | Get monitor | — |
| `GET /workspace/{workspaceId}/monitor/{monitorId}/data` | Get data | `startAt (query)`, `endAt (query)` |
| `GET /workspace/{workspaceId}/monitor/{monitorId}/recentData` | Get recent data | `take (query)` |
| `GET /workspace/{workspaceId}/monitor/{monitorId}/publicSummary` | Get public summary | — |
| `GET /workspace/{workspaceId}/monitor/{monitorId}/publicData` | Get public data | — |
| `GET /workspace/{workspaceId}/monitor/{monitorId}/dataMetrics` | Get data metrics | — |
| `GET /workspace/{workspaceId}/monitor/events` | Get events | `monitorId? (query)`, `limit? (query) default:20` |
| `GET /workspace/{workspaceId}/monitor/{monitorId}/status` | Get status | `statusName (query)` |

## Survey (8)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /workspace/{workspaceId}/survey/all` | Get all surveys | — |
| `GET /workspace/{workspaceId}/survey/{surveyId}/get` | Get survey | — |
| `GET /workspace/{workspaceId}/survey/{surveyId}/count` | Get result count | — |
| `GET /workspace/{workspaceId}/survey/allResultCount` | Get all result counts | — |
| `GET /workspace/{workspaceId}/survey/result/{resultId}` | Get result | — |
| `GET /workspace/{workspaceId}/survey/{surveyId}/result/list` | Get result list | `limit? (query) default:50`, `cursor? (query)`, `startAt? (query)`, `endAt? (query)`, `filter? (query)` |
| `GET /workspace/{workspaceId}/survey/{surveyId}/stats` | Get stats | `startAt? (query)`, `endAt? (query)` |
| `GET /workspace/{workspaceId}/survey/{surveyId}/aiCategoryList` | Get AI categories | — |

## Telemetry (7)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /workspace/{workspaceId}/telemetry/all` | Get all telemetry | — |
| `GET /workspace/{workspaceId}/telemetry/info` | Get telemetry info | `telemetryId (query)` |
| `GET /workspace/{workspaceId}/telemetry/allEventCount` | Get all event count | — |
| `GET /workspace/{workspaceId}/telemetry/eventCount` | Get event count | `telemetryId (query)` |
| `GET /workspace/{workspaceId}/telemetry/pageviews` | Get pageviews | `telemetryId (query)`, `startAt (query)`, `endAt (query)`, `unit? (query)`, `url? (query)`, `country? (query)`, `region? (query)`, `city? (query)`, `timezone? (query)` |
| `GET /workspace/{workspaceId}/telemetry/metrics` | Get metrics | `telemetryId (query)`, `type (query) enum:source|url|event|referrer|country`, `startAt (query)`, `endAt (query)`, `url? (query)`, `country? (query)`, `region? (query)`, `city? (query)`, `timezone? (query)` |
| `GET /workspace/{workspaceId}/telemetry/stats` | Get stats | `telemetryId (query)`, `startAt (query)`, `endAt (query)`, `unit? (query)`, `url? (query)`, `country? (query)`, `region? (query)`, `city? (query)`, `timezone? (query)` |

## Billing (7)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /billing/usage` | Get usage | `workspaceId (query)`, `startAt (query)`, `endAt (query)` |
| `GET /billing/limit` | Get limit | `workspaceId (query)` |
| `GET /billing/currentTier` | Get current tier | `workspaceId (query)` |
| `GET /billing/currentSubscription` | Get subscription | `workspaceId (query)` |
| `GET /billing/credit` | Get credit | `workspaceId (query)` |
| `GET /billing/credit/bills` | Get credit bills | `workspaceId (query)`, `page? (query) default:1`, `pageSize? (query) default:10` |
| `GET /billing/credit/packs` | Get credit packs | `workspaceId (query)` |

## Feed (6)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /workspace/{workspaceId}/feed/channels` | Get all channels | — |
| `GET /workspace/{workspaceId}/feed/{channelId}/info` | Get channel info | — |
| `GET /workspace/{workspaceId}/feed/{channelId}/fetchEventsByCursor` | Fetch events | `limit? (query) default:50`, `cursor? (query)`, `archived? (query) default:false` |
| `GET /feed/public/{shareId}/events` | feed-fetchPublicEventsByCursor | `limit? (query) default:50`, `cursor? (query)` |
| `GET /feed/public/{shareId}/info` | feed-getChannelByShareId | — |
| `GET /workspace/{workspaceId}/feed/state/all` | Get all states | `channelId (query)`, `limit? (query) default:5` |

## Application (5)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /workspace/{workspaceId}/application/all` | Get all applications | — |
| `GET /workspace/{workspaceId}/application/{applicationId}/info` | Get application info | — |
| `GET /application/storeAppSearch` | Search store apps | `workspaceId (query)`, `keyword (query)`, `storeType (query) enum:appstore|googleplay` |
| `GET /workspace/{workspaceId}/application/{applicationId}/storeInfoHistory` | Get store info history | `storeType (query) enum:appstore|googleplay`, `storeId? (query)`, `startAt (query)`, `endAt (query)` |
| `GET /workspace/{workspaceId}/application/{applicationId}/eventStats` | Get event stats | `startAt (query)`, `endAt (query)`, `timezone? (query)`, `unit? (query) enum:minute|hour|day|month|year` |

## AIGateway (1)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /workspace/{workspaceId}/aiGateway/all` | Get all gateways | — |

## AI (4)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /aiGateway/info` | Get gateway info | `workspaceId (query)`, `gatewayId (query)` |
| `GET /aiGateway/logs` | Get gateway logs | `workspaceId (query)`, `gatewayId (query)`, `cursor? (query)`, `limit? (query) default:20`, `logId? (query)` |
| `GET /aiGateway/model-pricing` | Get model pricing | `workspaceId (query)`, `search? (query)`, `limit? (query) default:10` |
| `GET /aiGateway/quota-alert` | Get quota alert | `workspaceId (query)`, `gatewayId (query)` |

## Worker (3)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /workspace/{workspaceId}/worker/all` | Get all workers in workspace | — |
| `GET /workspace/{workspaceId}/worker/{workerId}/info` | Get worker by ID | — |
| `GET /workspace/{workspaceId}/worker/{workerId}/revisions` | Get worker revisions | — |

## Page (2)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /workspace/{workspaceId}/page/all` | Get all pages | `type? (query) enum:status|static|all default:all` |
| `GET /page/{slug}` | Get page info | — |

## Workspace (2)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /workspace/{workspaceId}/members` | Get members | — |
| `GET /workspace/{workspaceId}/getServiceCount` | Get service count | — |

## Global (1)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /global/config` | Get global config | — |

## AuditLog (1)

| Endpoint | Summary | Key Params |
|----------|---------|------------|
| `GET /audit/fetchByCursor` | Fetch audit log | `workspaceId (query)`, `limit? (query) default:50`, `cursor? (query)` |
