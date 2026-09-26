# AI Gateway TPOT Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI Gateway TPOT monitoring for streaming LLM responses and expose TPOT p50/p90/p99 charts plus per-request output TPS display.

**Architecture:** Store standard TPOT latency as `AIGatewayLogs.tpot` in integer milliseconds per output token. Compute it once when streaming requests finish, query it through the existing AI Gateway insights SQL builder, and derive output TPS only at display time.

**Tech Stack:** TypeScript, Express request handlers, Prisma/PostgreSQL, Vitest snapshots, React, TanStack Table, TRPC, existing `InsightQueryChart`.

---

## File Structure

- Modify `src/server/model/aiGateway.ts`: export `calcAIGatewayTpot`, use it in OpenAI-compatible and Anthropic streaming log updates, and initialize pending logs with `tpot: -1`.
- Create `src/server/model/aiGateway.spec.ts`: focused unit tests for `calcAIGatewayTpot`.
- Modify `src/server/prisma/schema.prisma`: add `AIGatewayLogs.tpot`.
- Create `src/server/prisma/migrations/20260602000000_add_tpot_to_aigateway_logs/migration.sql`: add the database column.
- Modify `src/server/prisma/zod/aigatewaylogs.ts`: include `tpot` in the committed generated schema.
- Modify `src/server/model/insights/aiGateway.ts`: allow `tpot` metrics and filters; automatically exclude `tpot = -1` inside TPOT aggregate expressions.
- Modify `src/server/model/insights/aiGateway.spec.ts`: add TPOT percentile and invalid-value filtering SQL snapshot tests.
- Modify `src/server/model/insights/__snapshots__/aiGateway.spec.ts.snap`: update snapshots.
- Modify `src/client/components/aiGateway/useAIGatewayLogColumns.tsx`: add TPOT and Output TPS columns.
- Modify `src/client/components/aiGateway/AIGatewayLogTable.tsx`: show TPOT and Output TPS in the detail sheet.
- Modify `src/client/components/aiGateway/AIGatewayAnalytics.tsx`: add the TPOT percentile chart in the Performance tab.

Do not modify JSON files under `src/client/public/locales`.

---

### Task 1: TPOT Helper

**Files:**
- Create: `src/server/model/aiGateway.spec.ts`
- Modify: `src/server/model/aiGateway.ts:7-18`

- [ ] **Step 1: Write the failing helper tests**

Create `src/server/model/aiGateway.spec.ts`:

```ts
import { AIGatewayLogsStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { calcAIGatewayTpot } from './aiGateway.js';

describe('calcAIGatewayTpot', () => {
  test('returns -1 for non-streaming requests', () => {
    expect(
      calcAIGatewayTpot({
        stream: false,
        status: AIGatewayLogsStatus.Success,
        duration: 2000,
        ttft: 500,
        outputToken: 10,
      })
    ).toBe(-1);
  });

  test('returns -1 for failed requests', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Failed,
        duration: 2000,
        ttft: 500,
        outputToken: 10,
      })
    ).toBe(-1);
  });

  test('returns -1 when ttft is missing', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Success,
        duration: 2000,
        ttft: -1,
        outputToken: 10,
      })
    ).toBe(-1);
  });

  test('returns -1 when there are not enough output tokens', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Success,
        duration: 2000,
        ttft: 500,
        outputToken: 1,
      })
    ).toBe(-1);
  });

  test('returns rounded milliseconds per output token after first token', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Success,
        duration: 1735,
        ttft: 500,
        outputToken: 11,
      })
    ).toBe(124);
  });

  test('returns at least 1ms for valid sub-millisecond averages', () => {
    expect(
      calcAIGatewayTpot({
        stream: true,
        status: AIGatewayLogsStatus.Success,
        duration: 101,
        ttft: 100,
        outputToken: 20,
      })
    ).toBe(1);
  });
});
```

- [ ] **Step 2: Run the helper tests and verify RED**

Run:

```bash
pnpm --dir src/server vitest run model/aiGateway.spec.ts
```

Expected: FAIL because `calcAIGatewayTpot` is not exported from `src/server/model/aiGateway.ts`.

- [ ] **Step 3: Implement the helper**

In `src/server/model/aiGateway.ts`, add this export after the cache helper and before `openaiRequestSchema`:

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

  return Math.max(
    1,
    Math.round((args.duration - args.ttft) / (args.outputToken - 1))
  );
}
```

- [ ] **Step 4: Run the helper tests and verify GREEN**

Run:

```bash
pnpm --dir src/server vitest run model/aiGateway.spec.ts
```

Expected: PASS for all `calcAIGatewayTpot` tests.

- [ ] **Step 5: Commit**

```bash
git add src/server/model/aiGateway.ts src/server/model/aiGateway.spec.ts
git commit -m "test(aigateway): cover tpot calculation"
```

---

### Task 2: Database Schema

**Files:**
- Modify: `src/server/prisma/schema.prisma:974-991`
- Create: `src/server/prisma/migrations/20260602000000_add_tpot_to_aigateway_logs/migration.sql`
- Modify: `src/server/prisma/zod/aigatewaylogs.ts:27-42`

- [ ] **Step 1: Add the Prisma schema field**

In `src/server/prisma/schema.prisma`, add `tpot` after `ttft`:

```prisma
  duration        Int // All response usage time, unit: ms
  ttft            Int                 @default(-1) // Time To First Token, unit: ms
  tpot            Int                 @default(-1) @db.Integer // Time Per Output Token, unit: ms/token
  price           Decimal             @default(0.0) @db.Decimal(30, 13) // unit: usd
```

- [ ] **Step 2: Add the migration**

Create `src/server/prisma/migrations/20260602000000_add_tpot_to_aigateway_logs/migration.sql`:

```sql
ALTER TABLE "AIGatewayLogs" ADD COLUMN "tpot" INTEGER NOT NULL DEFAULT -1;
```

- [ ] **Step 3: Regenerate Prisma artifacts**

Run:

```bash
pnpm --dir src/server db:generate
```

Expected: Prisma Client and Zod schemas regenerate successfully. If the generated Zod schema does not change because local generator output is stale, update `src/server/prisma/zod/aigatewaylogs.ts` manually in the next step.

- [ ] **Step 4: Ensure the committed Zod schema contains `tpot`**

In `src/server/prisma/zod/aigatewaylogs.ts`, ensure the model schema includes:

```ts
  duration: z.number().int(),
  ttft: z.number().int(),
  tpot: z.number().int(),
  price: z.number(),
```

- [ ] **Step 5: Run the helper tests**

Run:

```bash
pnpm --dir src/server vitest run model/aiGateway.spec.ts
```

Expected: PASS. This catches obvious import or generated-schema breakage after Prisma changes.

- [ ] **Step 6: Commit**

```bash
git add src/server/prisma/schema.prisma src/server/prisma/migrations/20260602000000_add_tpot_to_aigateway_logs/migration.sql src/server/prisma/zod/aigatewaylogs.ts
git commit -m "feat(aigateway): add tpot log field"
```

---

### Task 3: Server Log Writes

**Files:**
- Modify: `src/server/model/aiGateway.ts:91-109`
- Modify: `src/server/model/aiGateway.ts:223-242`
- Modify: `src/server/model/aiGateway.ts:562-580`
- Modify: `src/server/model/aiGateway.ts:745-763`

- [ ] **Step 1: Add `tpot` to pending OpenAI-compatible logs**

In the `prisma.aIGatewayLogs.create` call inside `buildOpenAIHandler`, add `tpot: -1` after `ttft: 0`:

```ts
          duration: 0,
          ttft: 0,
          tpot: -1,
          requestPayload: payload,
```

- [ ] **Step 2: Write TPOT on successful OpenAI-compatible streaming logs**

Before the OpenAI-compatible streaming `prisma.aIGatewayLogs.update` call, compute:

```ts
          const tpot = calcAIGatewayTpot({
            stream: true,
            status: AIGatewayLogsStatus.Success,
            duration,
            ttft,
            outputToken,
          });
```

Add `tpot` to the update data after `ttft`:

```ts
              duration,
              ttft,
              tpot,
              price,
```

- [ ] **Step 3: Add `tpot` to pending Anthropic logs**

In the `prisma.aIGatewayLogs.create` call inside `buildAnthropicHandler`, add `tpot: -1` after `ttft: 0`:

```ts
          duration: 0,
          ttft: 0,
          tpot: -1,
          requestPayload: payload,
```

- [ ] **Step 4: Write TPOT on successful Anthropic streaming logs**

Before the Anthropic streaming `prisma.aIGatewayLogs.update` call, compute:

```ts
          const tpot = calcAIGatewayTpot({
            stream: true,
            status: AIGatewayLogsStatus.Success,
            duration,
            ttft,
            outputToken: outputTokens,
          });
```

Add `tpot` to the update data after `ttft`:

```ts
              duration,
              ttft,
              tpot,
              price,
```

- [ ] **Step 5: Leave failed and non-streaming updates untouched**

Do not add `tpot` to failed or non-streaming update calls. Those rows should keep the `-1` default from creation and the database column default.

- [ ] **Step 6: Run server tests**

Run:

```bash
pnpm --dir src/server vitest run model/aiGateway.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server/model/aiGateway.ts
git commit -m "feat(aigateway): record tpot for streaming logs"
```

---

### Task 4: Insights Support

**Files:**
- Modify: `src/server/model/insights/aiGateway.spec.ts:1-66`
- Modify: `src/server/model/insights/aiGateway.ts:15-52`
- Modify: `src/server/model/insights/aiGateway.ts:91-110`
- Modify: `src/server/model/insights/aiGateway.ts:119-135`
- Modify: `src/server/model/insights/__snapshots__/aiGateway.spec.ts.snap`

- [ ] **Step 1: Write failing insights tests**

Append these tests inside `describe('AIGatewayInsightsSqlBuilder', () => { ... })` in `src/server/model/insights/aiGateway.spec.ts`:

```ts
  test('basic query tpot percentile excludes invalid values', () => {
    const builder = new AIGatewayInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: 'tpot',
            math: 'p90',
          },
        ],
        filters: [],
        time: {
          startAt: 1739203200000,
          endAt: 1744273003917,
          unit: 'day',
        },
        groups: [],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = unwrapSQL(builder.build());
    expect(sql).toContain('PERCENTILE_CONT(0.9)');
    expect(sql).toContain('ORDER BY "tpot"');
    expect(sql).toContain('"AIGatewayLogs"."tpot" > -1');
    expect(sql).toMatchSnapshot('basic query tpot p90');
  });

  test('basic query tpot avg excludes invalid values', () => {
    const builder = new AIGatewayInsightsSqlBuilder(
      {
        insightId,
        insightType,
        workspaceId: '',
        metrics: [
          {
            name: 'tpot',
            math: 'avg',
          },
        ],
        filters: [],
        time: {
          startAt: 1739203200000,
          endAt: 1744273003917,
          unit: 'day',
        },
        groups: [],
      },
      {
        timezone: 'UTC',
      }
    );

    const sql = unwrapSQL(builder.build());
    expect(sql).toContain('AVG("AIGatewayLogs"."tpot")');
    expect(sql).toContain('"AIGatewayLogs"."tpot" > -1');
    expect(sql).toMatchSnapshot('basic query tpot avg');
  });
```

- [ ] **Step 2: Run insights tests and verify RED**

Run:

```bash
pnpm --dir src/server vitest run model/insights/aiGateway.spec.ts
```

Expected: FAIL because `tpot` is not yet whitelisted and invalid values are not filtered.

- [ ] **Step 3: Add a numeric metric allowlist**

In `src/server/model/insights/aiGateway.ts`, add a shared allowlist near the top of the file:

```ts
const AIGATEWAY_NUMERIC_METRIC_FIELDS = [
  'inputToken',
  'outputToken',
  'cacheReadInputToken',
  'cacheWriteInputToken',
  'price',
  'duration',
  'ttft',
  'tpot',
];
```

- [ ] **Step 4: Use the allowlist for numeric aggregations**

In `buildSelectQueryArr`, use the allowlist before interpolating `item.name` with `Prisma.raw` for `events`, `avg`, and percentile metrics. Unsupported metric names should return `null`.

For TPOT averages, use an aggregate-local filter:

```ts
AVG("AIGatewayLogs"."tpot") FILTER (WHERE "AIGatewayLogs"."tpot" > -1)
```

For TPOT percentiles, use an aggregate-local filter:

```ts
PERCENTILE_CONT(...) WITHIN GROUP (ORDER BY "AIGatewayLogs"."tpot") FILTER (WHERE "AIGatewayLogs"."tpot" > -1)
```

Do not add a global `WHERE "AIGatewayLogs"."tpot" > -1`, because mixed metric queries such as `$all_event` plus TPOT must not filter the non-TPOT aggregate.

- [ ] **Step 5: Allow explicit `tpot` filters**

In `buildFilterQueryOperator`, add `tpot` to the standard field whitelist:

```ts
        'duration',
        'ttft',
        'tpot',
        'price',
```

- [ ] **Step 6: Add mixed metric and unsafe metric tests**

Add tests for:

- Mixed `$all_event` plus `tpot avg` queries keeping `count(1)` unfiltered while TPOT uses `FILTER`.
- Unsupported `avg` and percentile metric names returning `null` from `buildSelectQueryArr()`.

- [ ] **Step 7: Run insights tests and update snapshots**

Run:

```bash
pnpm --dir src/server vitest run model/insights/aiGateway.spec.ts -u
```

Expected: PASS and the snapshot file updates with the new TPOT queries.

- [ ] **Step 8: Commit**

```bash
git add src/server/model/insights/aiGateway.ts src/server/model/insights/aiGateway.spec.ts src/server/model/insights/__snapshots__/aiGateway.spec.ts.snap
git commit -m "feat(aigateway): support tpot insights"
```

---

### Task 5: Log Table and Detail Display

**Files:**
- Modify: `src/client/components/aiGateway/useAIGatewayLogColumns.tsx:12-18`
- Modify: `src/client/components/aiGateway/useAIGatewayLogColumns.tsx:105-115`
- Modify: `src/client/components/aiGateway/AIGatewayLogTable.tsx:133-141`

- [ ] **Step 1: Add display helpers for TPOT and TPS**

In `src/client/components/aiGateway/useAIGatewayLogColumns.tsx`, add this helper after `renderNullableValue`:

```tsx
const renderOutputTps = (tpot: number) => {
  if (tpot <= 0) {
    return <span className="text-muted-foreground opacity-50">(null)</span>;
  }

  return (1000 / tpot).toFixed(2);
};
```

- [ ] **Step 2: Add table columns**

After the `ttft` column, add:

```tsx
      columnHelper.accessor('tpot', {
        header: t('TPOT (ms/token)'),
        size: 140,
        cell: (props) => renderNullableValue(props.getValue()),
      }),
      columnHelper.accessor('tpot', {
        id: 'outputTps',
        header: t('Output TPS'),
        size: 120,
        cell: (props) => renderOutputTps(props.getValue()),
      }),
```

- [ ] **Step 3: Add detail sheet display helpers**

In `src/client/components/aiGateway/AIGatewayLogTable.tsx`, add a local helper near the component-level render helpers:

```tsx
const renderNullableTiming = (value: number, suffix: string) => {
  if (value === -1) {
    return <span className="opacity-40">(null)</span>;
  }

  return `${value} ${suffix}`;
};

const renderOutputTpsText = (tpot: number) => {
  if (tpot <= 0) {
    return <span className="opacity-40">(null)</span>;
  }

  return `${(1000 / tpot).toFixed(2)} token/s`;
};
```

- [ ] **Step 4: Show TPOT and Output TPS in the detail sheet**

Replace the current TTFT block:

```tsx
                  <SheetDataSection label="TTFT">
                    {selectedItem.ttft} ms
                  </SheetDataSection>
```

with:

```tsx
                  <SheetDataSection label="TTFT">
                    {renderNullableTiming(selectedItem.ttft, 'ms')}
                  </SheetDataSection>

                  <SheetDataSection label="TPOT">
                    {renderNullableTiming(selectedItem.tpot, 'ms/token')}
                  </SheetDataSection>

                  <SheetDataSection label="Output TPS">
                    {renderOutputTpsText(selectedItem.tpot)}
                  </SheetDataSection>
```

- [ ] **Step 5: Run client type check**

Run:

```bash
pnpm --dir src/client check:type
```

Expected: PASS. If this script does not exist in the client package, run `pnpm check:type` from the repository root instead.

- [ ] **Step 6: Commit**

```bash
git add src/client/components/aiGateway/useAIGatewayLogColumns.tsx src/client/components/aiGateway/AIGatewayLogTable.tsx
git commit -m "feat(aigateway): display tpot in logs"
```

---

### Task 6: TPOT Analytics Chart

**Files:**
- Modify: `src/client/components/aiGateway/AIGatewayAnalytics.tsx:106-166`

- [ ] **Step 1: Add the TPOT percentile card**

In the first Performance tab grid, change:

```tsx
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
```

to:

```tsx
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
```

Then add this card after the First Token Response Time card:

```tsx
              <Card>
                <CardHeader>
                  <CardTitle>{t('Output Token Latency')}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      'TPOT percentiles (P50, P90, P99) showing streaming generation latency over time'
                    )}
                  </p>
                </CardHeader>
                <CardContent>
                  <InsightQueryChart
                    className="h-[300px] w-full"
                    workspaceId={workspaceId}
                    insightId={gatewayId}
                    insightType="aigateway"
                    metrics={[
                      { name: 'tpot', math: 'p50', alias: 'p50' },
                      { name: 'tpot', math: 'p90', alias: 'p90' },
                      { name: 'tpot', math: 'p99', alias: 'p99' },
                    ]}
                    filters={[]}
                    groups={[]}
                    time={timeConfig}
                    chartType="line"
                    valueProcessor={defaultValueProcessor.alwaysPositive}
                  />
                </CardContent>
              </Card>
```

- [ ] **Step 2: Do not add TPS percentile charts**

Leave speed display to the log table and detail sheet. The Performance tab should chart TPOT p50/p90/p99 so p90 and p99 continue to mean slow-tail latency.

- [ ] **Step 3: Run client type check**

Run:

```bash
pnpm --dir src/client check:type
```

Expected: PASS. If this script does not exist in the client package, run `pnpm check:type` from the repository root instead.

- [ ] **Step 4: Commit**

```bash
git add src/client/components/aiGateway/AIGatewayAnalytics.tsx
git commit -m "feat(aigateway): add tpot analytics chart"
```

---

### Task 7: Final Verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Run focused server tests**

Run:

```bash
pnpm --dir src/server vitest run model/aiGateway.spec.ts model/insights/aiGateway.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run type checks**

Run:

```bash
pnpm check:type
```

Expected: PASS.

- [ ] **Step 3: Inspect final diff**

Run:

```bash
git status --short
git diff --stat HEAD
```

Expected: only TPOT implementation files are changed after the last commit if any follow-up fixes were needed.

- [ ] **Step 4: Commit any verification fixes**

If verification required small fixes, commit them:

```bash
git add src/server/model/aiGateway.ts src/server/model/aiGateway.spec.ts src/server/prisma/schema.prisma src/server/prisma/zod/aigatewaylogs.ts src/server/model/insights/aiGateway.ts src/server/model/insights/aiGateway.spec.ts src/server/model/insights/__snapshots__/aiGateway.spec.ts.snap src/client/components/aiGateway/useAIGatewayLogColumns.tsx src/client/components/aiGateway/AIGatewayLogTable.tsx src/client/components/aiGateway/AIGatewayAnalytics.tsx
git commit -m "fix(aigateway): polish tpot monitoring"
```

Skip this commit if there are no uncommitted verification fixes.
