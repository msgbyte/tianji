# Tianji AI Router Design

## Goal

Add AI Router as a workspace-level feature that lets users expose one stable AI endpoint backed by multiple configured AI Gateways. The first version focuses on high-availability failover: when one compatible gateway attempt fails before a response is committed, Tianji automatically tries the next configured gateway in order.

AI Router is not a replacement for AI Gateway. AI Gateway remains the unit that stores upstream credentials, provider metadata, pricing behavior, request logs, quota alerts, and provider-specific proxy behavior. AI Router is the orchestration layer that groups eligible gateways into ordered protocol-specific failover chains.

## Product Scope

The first version supports:

- Multiple AI Router resources per workspace.
- Router endpoints that mirror the existing AI Gateway runtime entrypoints.
- Ordered failover chains grouped by protocol.
- Per-node gateway selection, model override, timeout, retryable status code configuration, and enabled state.
- Lightweight router orchestration logs that link back to existing `AIGatewayLogs`.
- A route editor UI that renders each protocol as a vertical lane of gateway nodes.

The first version intentionally does not support:

- Cross-protocol request translation, such as OpenAI Chat to Anthropic Messages.
- Dynamic load balancing by latency, cost, remaining quota, or success rate.
- Weighted traffic splitting.
- Arbitrary graph edges or loops.
- Free-form canvas editing as the persisted routing model.

## Protocol Boundary

AI Router exposes multiple entrypoints, but each request only fails over within a compatible protocol chain.

Router endpoints should mirror the current AI Gateway runtime surface:

```txt
/:workspaceId/:routerId/openai/v1/chat/completions
/:workspaceId/:routerId/openai/v1/responses

/:workspaceId/:routerId/deepseek/v1/chat/completions

/:workspaceId/:routerId/anthropic/v1/chat/completions
/:workspaceId/:routerId/anthropic/v1/messages

/:workspaceId/:routerId/openrouter/v1/chat/completions
/:workspaceId/:routerId/openrouter/v1/messages

/:workspaceId/:routerId/custom/v1/chat/completions
/:workspaceId/:routerId/custom/v1/messages
/:workspaceId/:routerId/custom/v1/responses
```

Provider and protocol are separate concepts:

- Provider describes the upstream provider for pricing, display, and provider-specific behavior, such as `openai`, `deepseek`, `anthropic`, `openrouter`, or `custom`.
- Protocol describes request compatibility for routing, such as `openai-chat`, `openai-responses`, or `anthropic-messages`.

For custom gateways, the provider may be `custom`, but the supported protocols must still be explicit. For example, a custom gateway may support `openai-chat`, `openai-responses`, `anthropic-messages`, or any combination of those protocols.

Endpoint-to-protocol mapping:

```txt
openai/v1/chat/completions: openai-chat
deepseek/v1/chat/completions: openai-chat
anthropic/v1/chat/completions: openai-chat
openrouter/v1/chat/completions: openai-chat
custom/v1/chat/completions: openai-chat

openai/v1/responses: openai-responses
custom/v1/responses: openai-responses

anthropic/v1/messages: anthropic-messages
openrouter/v1/messages: anthropic-messages
custom/v1/messages: anthropic-messages
```

## Gateway Eligibility

Extend `AIGateway` with provider and protocol capability fields:

```txt
AIGateway
- modelProvider: string?
- modelProtocols: string[]
```

When `modelApiKey` is set, `modelProvider` is required. A gateway appears in an AI Router node picker only when:

- `modelApiKey` is configured.
- `modelProvider` is configured.
- `modelProtocols` contains the protocol for the current route lane.

This makes a gateway's router eligibility visible at the gateway level instead of hiding it inside router configuration.

## Data Model

Add AI Router as a workspace-level resource:

```txt
AIRouter
- id
- workspaceId
- name
- enabled
- createdAt
- updatedAt
```

Add ordered router nodes:

```txt
AIRouterNode
- id
- workspaceId
- routerId
- gatewayId
- order
- enabled
- protocol
- modelOverride
- timeoutMs
- retryableStatusCodes
- createdAt
- updatedAt
```

The `protocol` field defines which route lane the node participates in. The `order` field defines the failover order within that protocol lane. A router may have multiple independent lanes, such as:

```txt
Router: production-router

openai-chat:
1. openai-main / gpt-4o-mini
2. deepseek-backup / deepseek-chat
3. custom-qwen-backup / qwen-plus

anthropic-messages:
1. anthropic-main / claude-sonnet-4
2. custom-anthropic-backup / claude-compatible-model
```

The persisted model is an ordered chain per protocol. The UI may render this visually, but the first version does not persist arbitrary graph coordinates or edges.

## Runtime Routing

When a router endpoint receives a request:

1. Parse the protocol from the route.
2. Load the router and enabled nodes for that protocol, ordered by `order`.
3. Filter out nodes whose gateway is missing, lacks `modelApiKey`, lacks `modelProvider`, or does not include the requested protocol in `modelProtocols`.
4. For each remaining node, apply `modelOverride` to the request model field.
5. Execute the gateway attempt.
6. Return the first successful attempt.
7. If every attempt fails, return the final failed response. For JSON error responses, include the router log id in the error metadata when the response body can be safely shaped by Tianji.

Model override applies to the protocol's existing model field:

```txt
openai-chat: body.model
openai-responses: body.model
anthropic-messages: body.model
```

The implementation should extract a shared gateway attempt executor from the existing AI Gateway handlers. Both direct AI Gateway endpoints and AI Router endpoints should use the same lower-level execution path for upstream requests, usage extraction, pricing, and `AIGatewayLogs` updates.

## Failover Rules

The default retryable failures are:

```txt
network error
timeout
429
500
502
503
504
```

The default non-retryable failures are:

```txt
400
401
403
404
422
```

Each node may override retryable HTTP status codes with `retryableStatusCodes`. Network errors and timeouts remain retryable in the first version.

## Streaming Behavior

Streaming failover must be conservative:

- If an upstream attempt fails before any response chunk is written to the client, the router may try the next compatible node.
- After any chunk has been written to the client, the router must not switch to another gateway.
- If a stream fails after output has started, the current attempt is marked failed or partial in `AIGatewayLogs`, the router log records a partial/failed orchestration result, and the client receives the protocol's natural stream failure or disconnect behavior.

This avoids mixing tokens from different upstream models in one client stream.

## Router Logs

Keep router logs lightweight because detailed request, response, token, timing, model, provider, and price data already exists in `AIGatewayLogs`.

Add one orchestration log table:

```txt
AIRouterLogs
- id
- workspaceId
- routerId
- protocol
- status: Success | Failed | Partial
- finalGatewayId
- finalGatewayLogId
- attemptGatewayIds: string[]
- attemptGatewayLogIds: string[]
- attemptErrors: Json?
- attemptCount
- duration
- createdAt
```

Semantics:

- `finalGatewayLogId` points to the final successful attempt or the final failed attempt.
- `attemptGatewayLogIds` stores the gateway log ids produced by each attempted gateway call.
- `attemptErrors` stores only lightweight summaries, such as status code, retryability, timeout, or error type. It should not duplicate full response payloads.
- Token usage, cost, request payload, response payload, model name, provider, TTFT, and TPOT should be read from the linked `AIGatewayLogs`.

Router analytics should start with orchestration metrics:

- Total router requests.
- Success rate.
- Fallback rate.
- Average attempt count.

Detailed usage and cost can be derived from linked gateway logs.

## UI

Add an AI Router section next to AI Gateway:

```txt
AI Router
- Router list
- Router detail
  - Overview
  - Routes
  - Logs
  - Usage
  - Settings
```

The `Routes` tab is the primary configuration surface. It renders each protocol as a vertical lane:

```txt
OpenAI Chat Completions
Endpoint: /openai/v1/chat/completions

[ OpenAI Main ]
  Provider: openai
  Model: gpt-4o-mini
  Timeout: 20s
        down
[ DeepSeek Backup ]
  Provider: deepseek
  Model: deepseek-chat
  Timeout: 20s
        down
[ Custom Qwen Backup ]
  Provider: custom
  Protocol: openai-chat
  Model: qwen-plus
  Timeout: 30s

[+ Add Gateway]
```

Each node card shows:

- Gateway name.
- Provider.
- Protocol.
- Model override.
- Timeout.
- Enabled state.
- Recent success or failure signal when available.

Node editing opens a side panel with:

- Gateway.
- Model override.
- Timeout.
- Retryable status codes.
- Enabled state.

Dragging nodes is limited to reordering within the same protocol lane. Cross-lane dragging is not supported in the first version because protocol compatibility is a hard runtime constraint.

The AI Gateway create/edit form should add provider and supported protocol fields. It should also show whether the gateway is eligible for AI Router and, if not, why.

## Error Handling

Invalid router configuration should fail early in management APIs:

- A router node cannot reference a gateway from another workspace.
- A router node's protocol must be included in the gateway's `modelProtocols`.
- `order` should be unique within a router and protocol, or normalized on save.
- A disabled router rejects runtime requests with a clear error.
- A protocol lane with no eligible nodes returns a clear runtime error.

Runtime attempts should record gateway logs even when an attempt fails, matching the current AI Gateway behavior.

## Testing

Add focused server tests for:

- Gateway validation requiring provider and supported protocols when `modelApiKey` is present.
- Router node eligibility filtering by protocol.
- Non-streaming failover from 429, 5xx, timeout, and network errors.
- No failover for default non-retryable 400, 401, 403, 404, and 422 responses.
- Per-node model override before forwarding to the upstream gateway executor.
- Router log creation with linked `AIGatewayLogs`.
- Stream failover before first chunk.
- No stream failover after first chunk.

Add focused UI tests for:

- The route editor only lists compatible gateways for a protocol lane.
- Reordering nodes updates order within the lane.
- Ineligible gateways show a clear reason in the gateway form or selection surface.

No translation JSON files under `src/client/public/locales` should be edited.

## Implementation Notes

The existing AI Gateway runtime logic is currently concentrated in `src/server/model/aiGateway.ts`. AI Router should not duplicate that behavior. The implementation should extract protocol-specific execution helpers so direct gateway routes and router attempts share:

- Credential resolution.
- Upstream request construction.
- Streaming forwarding.
- Usage extraction.
- Price calculation.
- Gateway log creation and finalization.
- Quota alert checks.

This keeps router behavior aligned with direct gateway behavior and reduces the risk of divergent pricing or logging semantics.
