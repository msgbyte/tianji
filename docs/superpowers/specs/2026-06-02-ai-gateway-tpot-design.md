# AI Gateway TPOT Monitoring Design

## Goal

Add per-request Time Per Output Token monitoring to AI Gateway so users can inspect streaming generation latency with p50, p90, and p99 charts, while also seeing the more intuitive output speed in tokens per second where it helps.

## Metric Definition

Store `tpot` as an integer number of milliseconds per output token:

```txt
tpot = max(1, round((duration - ttft) / (outputToken - 1)))
```

The metric is valid only for successful streaming requests where `ttft >= 0` and `outputToken > 1`. For non-streaming requests, failed requests, or responses with fewer than two output tokens, store `-1`.

The UI may derive output speed from TPOT:

```txt
outputTokensPerSecond = 1000 / tpot
```

This keeps analytics aligned with common LLM latency metrics. TPOT p50, p90, and p99 are meaningful tail-latency charts because larger TPOT means slower generation. A p90 chart over tokens per second would be less useful for slow-tail analysis because larger TPS means faster generation.

## Aggregation Semantics

For a single request, TPS is the reciprocal of TPOT after unit conversion:

```txt
requestOutputTPS = 1000 / requestTPOT
```

For a time range, `1000 / avg(tpot)` is not the same as `avg(1000 / tpot)`. The reciprocal should not be applied to an unweighted average TPOT if the chart label says average per-request TPS.

Use these rules:

- `avg(tpot)` means average per-request output token latency. This is useful for latency charts.
- `avg(1000 / tpot)` means average per-request output speed. This weights each request equally.
- `sum(outputToken - 1) / sum((duration - ttft) / 1000)` means global output throughput for the selected time range. This equals `1000 / weightedAvg(tpot)` when TPOT is weighted by `outputToken - 1`.

The first implementation should prioritize TPOT percentile charts. If a time-range TPS summary is added later, it should use the global throughput formula rather than the reciprocal of a plain average TPOT.

## Architecture

Extend the existing `AIGatewayLogs` record rather than adding a separate telemetry table. AI Gateway already stores `duration`, `ttft`, token counts, request metadata, and response metadata per request, and the insights SQL builder already supports field-based aggregations for p50, p90, p99, averages, and filters.

The implementation should add a `tpot` column to `AIGatewayLogs`, write it from the OpenAI-compatible and Anthropic streaming handlers, expose it through existing TRPC log responses, and allow it in AI Gateway insights queries.

## Components

### Database

Add `AIGatewayLogs.tpot Int @default(-1) @db.Integer` with a comment describing the unit as milliseconds per output token. Add a Prisma migration that creates the column with default `-1` so existing rows remain explicitly invalid for TPOT charts.

Regenerate or update the committed Prisma Zod model schema so API outputs include `tpot`.

### Server Metric Calculation

Introduce a small helper for TPOT calculation, for example:

```ts
export function calcAIGatewayTpot(args: {
  stream: boolean;
  status: AIGatewayLogsStatus;
  duration: number;
  ttft: number;
  outputToken: number;
}) {
  if (!args.stream || args.status !== AIGatewayLogsStatus.Success) {
    return -1;
  }

  if (args.ttft < 0 || args.outputToken <= 1 || args.duration <= args.ttft) {
    return -1;
  }

  return Math.round((args.duration - args.ttft) / (args.outputToken - 1));
}
```

Use this helper when finalizing successful streaming logs in both `buildOpenAIHandler` and `buildAnthropicHandler`. Keep failed and non-streaming updates at the default `-1`.

### Insights

Allow `tpot` in the AI Gateway insights metric whitelist and filter whitelist. Percentile queries should exclude invalid `-1` values when querying `tpot`, otherwise non-streaming and short-output requests would distort p50/p90/p99. The filtering should be automatic for metric aggregations on `tpot` so chart callers do not need to remember an extra filter.

The primary chart should be named around TPOT, not TPS:

```txt
Output Token Latency
TPOT percentiles (P50, P90, P99) showing streaming generation latency over time
```

### UI

In the log table and detail sheet, show `TPOT (ms/token)` for the stored metric. Where useful, derive and display `Output TPS` from `tpot` for valid values. Invalid values should render like existing nullable fields.

In the Performance tab, add a TPOT percentile chart with p50, p90, and p99. This chart should use `tpot` directly and should not display p90 TPS, because high percentile TPS represents fast requests rather than slow-tail behavior.

No translation JSON files under `src/client/public/locales` should be edited.

## Data Flow

1. A client sends a streaming OpenAI-compatible or Anthropic request through AI Gateway.
2. The handler creates a pending `AIGatewayLogs` row with `tpot = -1`.
3. The streaming handler records TTFT when the first non-empty output token/chunk is observed.
4. The handler finishes the stream, computes final `duration` and `outputToken`, then computes TPOT.
5. The successful log update writes `duration`, `ttft`, `outputToken`, `tpot`, cost, and response payload.
6. Logs and analytics read `tpot` from the same existing TRPC and insights paths.

## Error Handling

Failed requests keep `tpot = -1`. Non-streaming requests keep `tpot = -1` because there is no observable token cadence. Streaming responses with no valid TTFT, one output token, or inconsistent timing also keep `tpot = -1`.

Insights percentile calculations must ignore invalid `-1` TPOT records. Log table rendering should treat `-1` as empty or null, matching the current `ttft` behavior.

## Testing

Add focused tests for the TPOT helper:

- Returns `-1` for non-streaming requests.
- Returns `-1` for failed requests.
- Returns `-1` when `ttft < 0`.
- Returns `-1` when `outputToken <= 1`.
- Returns rounded milliseconds per token for a valid streaming success.

Add AI Gateway insights SQL tests:

- `tpot` percentile query emits `PERCENTILE_CONT` over `tpot`.
- `tpot` aggregation excludes rows where `tpot = -1`.

Run the focused tests first, then run the repository's relevant type check if practical:

```bash
pnpm vitest run src/server/model/aiGateway.spec.ts src/server/model/insights/aiGateway.spec.ts
pnpm check:type
```
