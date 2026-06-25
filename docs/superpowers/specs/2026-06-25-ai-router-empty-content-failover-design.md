# AI Router Empty Content Failover Design

## Summary

AI Router should optionally treat an upstream response with no usable assistant
content as a failed gateway attempt. When enabled on a gateway route, an empty
content response should fall through to the next eligible route in the same tier
and then to lower tiers through the existing retry flow.

The setting is node scoped so each configured gateway route can opt in without
changing existing router behavior.

## Goals

- Add explicit route configuration for empty content failover.
- Preserve existing behavior by default.
- Avoid replaying an empty successful response to the client when another
  eligible route can be tried.
- Keep tool-only responses valid when they contain no text content.
- Record enough attempt metadata to explain why failover happened.

## Non-Goals

- Do not make empty content failover a router-wide default.
- Do not change AI Gateway behavior outside AIRouter runtime attempts.
- Do not change translation JSON files under `src/client/public/locales`.
- Do not add semantic quality checks for weak or irrelevant model output.

## Configuration

Add a boolean field to `AIRouterNode`:

```ts
failOnEmptyContent: boolean
```

Default: `false`.

The route editor should expose this as a switch in the gateway route dialog.
When enabled, the route card should show that empty content triggers failover.

The TRPC `replaceTiers` input should accept the field, persist it with each
node, and return it through the existing router info output.

## Runtime Behavior

The existing router attempt flow already buffers each gateway attempt before
writing to the real client. The empty content check should run after a gateway
attempt finishes and before the buffered response is considered successful.

If all of these are true:

- the node has `failOnEmptyContent` enabled,
- the upstream attempt finished with a 2xx status,
- the attempt did not partially write failed output,
- the protocol-specific response parser finds no usable text content,
- the response is not a tool-only/function-call response,

then the attempt result should be converted to:

```ts
{
  ok: false,
  committed: false,
  statusCode: 502,
  failure: {
    message: 'AI Router gateway returned empty content',
    errorType: 'empty_content',
  },
}
```

Because the attempt remains uncommitted, `runAIRouterAttempts` can continue to
the next retryable route by using the existing failover loop.

## Empty Content Detection

Use protocol-aware extraction instead of checking raw body length.

OpenAI Chat:

- Non-stream: concatenate `choices[*].message.content`.
- Stream: concatenate `choices[*].delta.content` from SSE `data:` chunks.
- Treat tool/function calls as non-empty work even when text content is empty.

OpenAI Responses:

- Non-stream: use `output_text`, then fall back to text items in
  `output[].content[]`.
- Stream: concatenate `response.output_text.delta` event deltas.
- Treat tool/function-call output items as non-empty work.

Anthropic Messages:

- Non-stream: concatenate `content[]` blocks where `type === 'text'`.
- Stream: concatenate `content_block_delta` events with `text_delta`.
- Treat tool-use blocks as non-empty work.

After extraction, empty means the concatenated text is empty after `trim()`.

If the response shape cannot be parsed, do not treat it as empty content. That
keeps unknown provider formats from becoming false failures.

## Error Handling And Logs

`empty_content` should be treated as a retryable router failure only when the
node opts in. Attempt summaries and `attemptErrors` should include:

- `gatewayId`
- `gatewayLogId` when available
- `statusCode: 502`
- `retryable: true`
- `errorType: 'empty_content'`
- `message: 'AI Router gateway returned empty content'`

If every eligible route fails this way, the final router response should use the
same `router_failed` envelope as other exhausted attempts.

## UI

In `AIRouterRouteEditor`, add a switch near other route behavior controls:

- Label: `Fail on empty content`
- Default off for new routes.
- Existing routes without the field should normalize to off.

The route card can show a compact metric such as:

- Label: `Empty Content`
- Value: `Failover` or `Allow`

## Data And Migration

Add a migration that adds:

```sql
ALTER TABLE "AIRouterNode"
  ADD COLUMN "failOnEmptyContent" BOOLEAN NOT NULL DEFAULT false;
```

Update Prisma schema and generated zod model schema so server and client types
include the field.

## Tests

Server model tests:

- Node input and persistence include `failOnEmptyContent`.
- Empty OpenAI Chat content fails over when enabled.
- Empty OpenAI Responses content fails over when enabled.
- Empty Anthropic Messages content fails over when enabled.
- Empty content is accepted when the option is disabled.
- Tool-only/function-call responses are accepted.
- Attempt logs include `empty_content` metadata.

Client component tests:

- New route defaults `failOnEmptyContent` to false.
- Enabling the switch persists true through `replaceTiers`.
- Editing an existing route preserves and updates the setting.

## Rollout

The migration is backward compatible because the default is false. Existing
routers continue to return empty successful responses until a route explicitly
enables empty content failover.
