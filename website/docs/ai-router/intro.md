---
sidebar_position: 1
---

# AI Router

AI Router gives one stable AI endpoint for a group of AI Gateways. It routes each request through configured gateway routes, spreads traffic by weight inside the same tier, and falls back to the next tier when retryable failures happen.

Use it when you want:

- One endpoint for your application instead of hard-coding one AI provider.
- Weighted traffic split across multiple gateways.
- Fallback from a primary provider to backup providers during outages or rate limits.
- A migration path where you can move traffic gradually by changing weights.

## How it relates to AI Gateway

AI Gateway is still the unit that stores provider credentials, custom base URLs, model pricing, quota alerts, and gateway logs. AI Router does not replace that.

AI Router only decides which gateway route should receive the request.

The runtime flow is:

1. Your application calls an AI Router endpoint.
2. AI Router finds the router by workspace ID and router ID.
3. AI Router chooses an eligible gateway route from the first tier.
4. The selected AI Gateway sends the request to the upstream AI provider.
5. If the attempt succeeds, AI Router returns that response.
6. If the attempt fails with a retryable error, AI Router tries another route in the same tier, then the next tier.

## Prerequisites

Before adding routes, create at least one AI Gateway with a stored model API key. Gateways without a stored key are not shown in the AI Router route picker.

Runtime requests still need a Tianji API key:

- For OpenAI-compatible endpoints, send `Authorization: Bearer <YOUR_TIANJI_API_KEY>`.
- For Anthropic Messages endpoints, send `x-api-key: <YOUR_TIANJI_API_KEY>`.

Tianji verifies the caller API key, then uses the stored AI Gateway provider key for the upstream request.

## Create a router

1. Open **AI Router** in the Tianji sidebar.
2. Click **Add AI Router**.
3. Enter a router name.
4. Keep **Enabled** on if the router should accept runtime traffic.
5. Save the router.

After the router is created, open the **Routes** tab to configure tiers and gateway routes.

## Tiers

A tier is a fallback level.

Requests always start at the first tier. If a retryable failure happens, AI Router keeps trying eligible routes in that tier. If every eligible route in the tier fails, AI Router moves to the next tier.

Use multiple tiers when you want strict fallback order.

Example:

| Tier | Routes | Meaning |
| --- | --- | --- |
| Tier 1 | OpenAI primary, OpenRouter primary | Normal production traffic |
| Tier 2 | DeepSeek backup | Backup after primary providers fail |
| Tier 3 | Custom internal model | Last-resort fallback |

Drag tiers to reorder them. The top tier is tried first.

## Weights inside a tier

Routes inside the same tier do not have a fixed order. They share traffic by weight.

Example:

| Route | Weight | Approximate first-attempt share |
| --- | ---: | ---: |
| Gateway A | 80 | 80% |
| Gateway B | 20 | 20% |

This is useful for:

- Random traffic split across providers.
- Gradual migration from one provider to another.
- Canarying a new gateway with a small percentage of traffic.

If you need strict order, put the routes in different tiers instead of the same tier.

## Add a gateway route

On the **Routes** tab:

1. Click **Add Gateway** inside a tier.
2. Select an existing AI Gateway.
3. Select the provider mode for this route.
4. Set the route options.
5. Save.

You can edit or delete a route later from the route card.

### Provider

Provider controls how AI Router calls the selected AI Gateway for this route. The same AI Gateway can be used in different routes with different provider modes if that matches your setup.

Supported provider values:

- `openai`
- `deepseek`
- `anthropic`
- `openrouter`
- `custom`

For `custom`, AI Router uses the custom model settings stored on the selected AI Gateway, such as custom base URL and custom model name.

### Weight

Weight controls how traffic is distributed between routes in the same tier. Higher weight means the route is more likely to be tried first.

Default: `100`.

### Model Override

Model Override is optional.

When set, AI Router replaces the request `model` with this value before sending the request to the selected gateway route. Leave it empty if the application request should decide the model.

### Timeout

Timeout is the maximum time for one gateway attempt.

Default: `30000ms`.

If the attempt times out, AI Router treats it as retryable and can try the next eligible route.

### Retryable Status Codes

AI Router always treats network errors, timeouts, and these status codes as retryable:

- `429`
- `500`
- `502`
- `503`
- `504`

Use **Retryable Status Codes** to add more status codes for a route. For example, you can add `408` if a provider often reports request timeout as an HTTP response.

Be careful with validation errors such as `400` or `401`. Those usually mean the request or key is wrong, and retrying another provider can hide the real problem.

### Fail on Empty Content

Fail on Empty Content is optional and defaults to off.

When enabled for a gateway route, AI Router treats a successful upstream response with no assistant text content as a failed attempt. It then tries the next eligible route in the same tier, followed by lower tiers if needed.

Tool-only responses are still treated as valid responses. This prevents function calling or tool-use requests from failing only because they did not produce assistant text.

## Logs

The **Logs** tab shows runtime attempts for a router:

- Status: `Success`, `Failed`, or `Partial`.
- Protocol: the matched request protocol.
- Attempts: how many gateway routes were tried.
- Final Gateway: the gateway that produced the final result.
- Final Gateway Log: the linked AI Gateway log ID.
- Duration.

Use router logs to understand failover behavior. Use the linked AI Gateway logs to inspect token usage, upstream model details, cost, and provider response data.
