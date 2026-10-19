# AI Router Empty Content Failover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-route AI Router option that treats empty upstream assistant content as a retryable failure and falls through to the next configured gateway route.

**Architecture:** Store `failOnEmptyContent` on `AIRouterNode`, pass it through TRPC and the route editor, and evaluate buffered gateway responses before replaying them to the client. Protocol-specific inspectors extract assistant text for OpenAI Chat, OpenAI Responses, and Anthropic Messages while treating tool-only responses as valid non-empty work.

**Tech Stack:** TypeScript, Express, Prisma, Zod, React, Vitest, React Testing Library, pnpm.

---

## File Structure

- Modify `src/server/prisma/schema.prisma` to add the new `AIRouterNode.failOnEmptyContent` field.
- Create `src/server/prisma/migrations/20260625000000_add_ai_router_empty_content_failover/migration.sql` for the database migration.
- Modify `src/server/prisma/zod/airouternode.ts` so generated output schemas include the field.
- Modify `src/server/trpc/routers/aiRouter.ts` to accept and persist `failOnEmptyContent` through `replaceTiers`.
- Modify `src/client/components/aiRouter/AIRouterRouteEditor.tsx` to edit, normalize, display, and submit the setting.
- Modify `src/client/components/aiRouter/AIRouterRouteEditor.component.spec.tsx` to cover default and enabled UI persistence.
- Modify `src/server/model/aiRouter.ts` to inspect buffered response content and convert opted-in empty responses into retryable failures.
- Modify `src/server/model/aiRouter.spec.ts` to cover protocol parsing, tool-only responses, and failover logging.
- Modify `website/docs/ai-router/intro.md` to document the setting. Do not modify JSON translation files.

## Task 1: Add Configuration Persistence

**Files:**
- Modify: `src/server/prisma/schema.prisma`
- Create: `src/server/prisma/migrations/20260625000000_add_ai_router_empty_content_failover/migration.sql`
- Modify: `src/server/prisma/zod/airouternode.ts`
- Modify: `src/server/trpc/routers/aiRouter.ts`

- [ ] **Step 1: Write the failing API shape change**

Update `src/server/trpc/routers/aiRouter.ts` input schema to the target shape first so TypeScript reveals every missing persistence location:

```ts
const aiRouterNodeInputSchema = z.object({
  gatewayId: z.string(),
  provider: z.enum(AI_ROUTER_PROVIDER_VALUES).default('openai'),
  order: z.number().int().min(0),
  enabled: z.boolean().default(true),
  weight: z.number().int().min(0).max(100000).default(100),
  modelOverride: z.string().nullable().default(null),
  timeoutMs: z.number().int().min(1000).max(300000).default(30000),
  retryableStatusCodes: z.array(z.number().int().min(100).max(599)).default([]),
  failOnEmptyContent: z.boolean().default(false),
});
```

- [ ] **Step 2: Run typecheck to verify it fails before persistence is wired**

Run: `pnpm check:type`

Expected: FAIL with Prisma create input or model schema complaints because `failOnEmptyContent` does not exist on the Prisma model yet.

- [ ] **Step 3: Add the Prisma model field**

In `src/server/prisma/schema.prisma`, update `model AIRouterNode`:

```prisma
model AIRouterNode {
  id                   String   @id @default(cuid()) @db.VarChar(30)
  workspaceId          String   @db.VarChar(30)
  routerId             String   @db.VarChar(30)
  tierId               String   @db.VarChar(30)
  gatewayId            String   @db.VarChar(30)
  provider             String   @default("openai")
  order                Int      @db.Integer
  enabled              Boolean  @default(true) @db.Boolean
  weight               Int      @default(100) @db.Integer
  modelOverride        String?
  timeoutMs            Int      @default(30000) @db.Integer
  retryableStatusCodes Int[]    @default([])
  failOnEmptyContent   Boolean  @default(false) @db.Boolean
  createdAt            DateTime @default(now()) @db.Timestamptz(6)
  updatedAt            DateTime @updatedAt @db.Timestamptz(6)

  workspace Workspace @relation(fields: [workspaceId], references: [id], onUpdate: Cascade, onDelete: Cascade)
  router    AIRouter  @relation(fields: [workspaceId, routerId], references: [workspaceId, id], onUpdate: Cascade, onDelete: Cascade)
  tier      AIRouterTier @relation(fields: [workspaceId, routerId, tierId], references: [workspaceId, routerId, id], onUpdate: Cascade, onDelete: Cascade)
  gateway   AIGateway @relation(fields: [gatewayId], references: [id], onUpdate: Cascade, onDelete: NoAction)

  @@unique([routerId, tierId, order])
  @@index([workspaceId])
  @@index([routerId])
  @@index([tierId])
  @@index([gatewayId])
  @@index([enabled])
}
```

- [ ] **Step 4: Add the SQL migration**

Create `src/server/prisma/migrations/20260625000000_add_ai_router_empty_content_failover/migration.sql`:

```sql
ALTER TABLE "AIRouterNode"
  ADD COLUMN "failOnEmptyContent" BOOLEAN NOT NULL DEFAULT false;
```

- [ ] **Step 5: Update the generated zod model**

In `src/server/prisma/zod/airouternode.ts`, add the field after `retryableStatusCodes`:

```ts
export const AIRouterNodeModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  routerId: z.string(),
  tierId: z.string(),
  gatewayId: z.string(),
  provider: z.string(),
  order: z.number().int(),
  enabled: z.boolean(),
  weight: z.number().int(),
  modelOverride: z.string().nullish(),
  timeoutMs: z.number().int(),
  retryableStatusCodes: z.number().int().array(),
  failOnEmptyContent: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
```

- [ ] **Step 6: Persist the field in `replaceTiers`**

In `src/server/trpc/routers/aiRouter.ts`, add the field to the `createMany` data:

```ts
await tx.aIRouterNode.createMany({
  data: tier.nodes.map((node) => ({
    workspaceId: input.workspaceId,
    routerId: router.id,
    tierId: createdTier.id,
    gatewayId: node.gatewayId,
    provider: node.provider,
    order: node.order,
    enabled: node.enabled,
    weight: node.weight,
    modelOverride: node.modelOverride,
    timeoutMs: node.timeoutMs,
    retryableStatusCodes: node.retryableStatusCodes,
    failOnEmptyContent: node.failOnEmptyContent,
  })),
});
```

- [ ] **Step 7: Run typecheck**

Run: `pnpm check:type`

Expected: PASS for the backend schema plumbing, or fail only on client code that has not yet been updated for the new field.

- [ ] **Step 8: Commit**

```bash
git add src/server/prisma/schema.prisma src/server/prisma/migrations/20260625000000_add_ai_router_empty_content_failover/migration.sql src/server/prisma/zod/airouternode.ts src/server/trpc/routers/aiRouter.ts
git commit -m "feat(ai-router): persist empty content failover setting"
```

## Task 2: Add Route Editor UI And Client Persistence Tests

**Files:**
- Modify: `src/client/components/aiRouter/AIRouterRouteEditor.component.spec.tsx`
- Modify: `src/client/components/aiRouter/AIRouterRouteEditor.tsx`

- [ ] **Step 1: Update existing component test expectations to include the default**

In `src/client/components/aiRouter/AIRouterRouteEditor.component.spec.tsx`, every expected node payload passed to `replaceTiersMutateAsync` should include:

```ts
failOnEmptyContent: false,
```

For example, the first add-route expectation should become:

```ts
expect(replaceTiersMutateAsync).toHaveBeenCalledWith({
  workspaceId: 'workspace_1',
  routerId: 'router_1',
  tiers: [
    {
      order: 0,
      nodes: [
        {
          gatewayId: 'gateway_1',
          provider: 'openrouter',
          order: 0,
          enabled: true,
          weight: 100,
          modelOverride: null,
          timeoutMs: 30000,
          retryableStatusCodes: [429, 500, 502, 503, 504],
          failOnEmptyContent: false,
        },
      ],
    },
  ],
});
```

- [ ] **Step 2: Add a failing test for enabling the switch**

Append this test inside `describe('AIRouterRouteEditor', () => { ... })`:

```tsx
test('persists failOnEmptyContent when enabled on a gateway route', () => {
  replaceTiersMutateAsync.mockResolvedValue(undefined);

  render(<AIRouterRouteEditor routerId="router_1" tiers={[]} />);

  fireEvent.click(screen.getByRole('button', { name: /Add Gateway/ }));
  fireEvent.click(screen.getByRole('option', { name: 'Primary Gateway' }));
  fireEvent.click(screen.getByLabelText('Fail on empty content'));
  fireEvent.click(
    screen.getAllByRole('button', { name: /Add Gateway/ }).at(-1)!
  );

  expect(replaceTiersMutateAsync).toHaveBeenCalledWith({
    workspaceId: 'workspace_1',
    routerId: 'router_1',
    tiers: [
      {
        order: 0,
        nodes: [
          {
            gatewayId: 'gateway_1',
            provider: 'openai',
            order: 0,
            enabled: true,
            weight: 100,
            modelOverride: null,
            timeoutMs: 30000,
            retryableStatusCodes: [429, 500, 502, 503, 504],
            failOnEmptyContent: true,
          },
        ],
      },
    ],
  });
});
```

- [ ] **Step 3: Run the component test and verify it fails**

Run: `pnpm vitest run src/client/components/aiRouter/AIRouterRouteEditor.component.spec.tsx`

Expected: FAIL because the switch label does not exist and payloads do not include `failOnEmptyContent`.

- [ ] **Step 4: Add the field to draft types and form state**

In `src/client/components/aiRouter/AIRouterRouteEditor.tsx`, include `failOnEmptyContent` in `AIRouterNodeDraft`:

```ts
type AIRouterNodeDraft = Pick<
  AIRouterNode,
  | 'gatewayId'
  | 'provider'
  | 'order'
  | 'enabled'
  | 'weight'
  | 'modelOverride'
  | 'timeoutMs'
  | 'retryableStatusCodes'
  | 'failOnEmptyContent'
>;
```

Extend `AddNodeFormState`:

```ts
interface AddNodeFormState {
  gatewayId: string;
  provider: AIRouterProviderValue;
  weight: string;
  modelOverride: string;
  timeoutMs: string;
  retryableStatusCodes: number[];
  failOnEmptyContent: boolean;
}
```

Update the default:

```ts
const defaultAddNodeFormState: AddNodeFormState = {
  gatewayId: '',
  provider: 'openai',
  weight: '100',
  modelOverride: '',
  timeoutMs: '30000',
  retryableStatusCodes: [429, 500, 502, 503, 504],
  failOnEmptyContent: false,
};
```

- [ ] **Step 5: Persist the form value**

In `handleSubmitNode`, add the field to `nextNode`:

```ts
const nextNode: AIRouterNodeDraft = {
  gatewayId: addNodeForm.gatewayId,
  provider: addNodeForm.provider,
  order: existingNode?.order ?? tier.nodes.length,
  enabled: existingNode?.enabled ?? true,
  weight: normalizeWeight(addNodeForm.weight),
  modelOverride: addNodeForm.modelOverride.trim() || null,
  timeoutMs: normalizeTimeoutMs(addNodeForm.timeoutMs),
  retryableStatusCodes: normalizeRetryableStatusCodes(
    addNodeForm.retryableStatusCodes
  ),
  failOnEmptyContent: addNodeForm.failOnEmptyContent,
};
```

In `createNodeFormState`, return:

```ts
function createNodeFormState(node: AIRouterNodeDraft): AddNodeFormState {
  return {
    gatewayId: node.gatewayId,
    provider: normalizeProvider(node.provider),
    weight: String(normalizeWeight(node.weight)),
    modelOverride: node.modelOverride ?? '',
    timeoutMs: String(normalizeTimeoutMs(node.timeoutMs)),
    retryableStatusCodes: normalizeRetryableStatusCodes(
      node.retryableStatusCodes ?? []
    ),
    failOnEmptyContent: Boolean(node.failOnEmptyContent),
  };
}
```

In `normalizeTiersForMutation`, include:

```ts
failOnEmptyContent: Boolean(node.failOnEmptyContent),
```

- [ ] **Step 6: Add the switch UI**

In the route dialog form, place this block after the retryable status code field:

```tsx
<div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
  <div className="min-w-0">
    <label
      className="text-sm font-medium"
      htmlFor="failOnEmptyContent"
    >
      {t('Fail on empty content')}
    </label>
    <div className="text-muted-foreground mt-0.5 text-xs">
      {t('Try the next route when the upstream response has no text output.')}
    </div>
  </div>
  <Switch
    id="failOnEmptyContent"
    aria-label={t('Fail on empty content')}
    checked={addNodeForm.failOnEmptyContent}
    onCheckedChange={(failOnEmptyContent) =>
      setAddNodeForm((prev) => ({
        ...prev,
        failOnEmptyContent,
      }))
    }
    disabled={isSaving}
  />
</div>
```

- [ ] **Step 7: Show the setting on route cards**

Change the metrics grid from four columns to five columns:

```tsx
<div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
```

Add a metric after `Retryable`:

```tsx
<Metric
  label={t('Empty Content')}
  value={node.failOnEmptyContent ? t('Failover') : t('Allow')}
/>
```

- [ ] **Step 8: Run the component test**

Run: `pnpm vitest run src/client/components/aiRouter/AIRouterRouteEditor.component.spec.tsx`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/client/components/aiRouter/AIRouterRouteEditor.tsx src/client/components/aiRouter/AIRouterRouteEditor.component.spec.tsx
git commit -m "feat(ai-router): add empty content route option"
```

## Task 3: Add Protocol-Aware Empty Content Inspection

**Files:**
- Modify: `src/server/model/aiRouter.ts`
- Modify: `src/server/model/aiRouter.spec.ts`

- [ ] **Step 1: Add failing unit tests for response inspection**

In `src/server/model/aiRouter.spec.ts`, import the helper that this task will add:

```ts
import {
  inspectAIRouterBufferedResponseContent,
} from './aiRouter.js';
```

Add tests inside `describe('AI Router buffered attempt mapping', () => { ... })`:

```ts
test('detects empty OpenAI chat content while allowing tool calls', () => {
  expect(
    inspectAIRouterBufferedResponseContent(
      AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
      {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        chunks: [],
        jsonBody: {
          choices: [{ message: { role: 'assistant', content: '   ' } }],
        },
        wroteBody: true,
        bodyStartedBeforeFailure: false,
        ended: true,
      }
    )
  ).toEqual({ parsed: true, empty: true, hasToolWork: false, text: '' });

  expect(
    inspectAIRouterBufferedResponseContent(
      AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
      {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        chunks: [],
        jsonBody: {
          choices: [
            {
              message: {
                role: 'assistant',
                content: '',
                tool_calls: [{ id: 'call_1', type: 'function' }],
              },
            },
          ],
        },
        wroteBody: true,
        bodyStartedBeforeFailure: false,
        ended: true,
      }
    )
  ).toEqual({ parsed: true, empty: false, hasToolWork: true, text: '' });
});

test('detects empty OpenAI responses and Anthropic message content', () => {
  expect(
    inspectAIRouterBufferedResponseContent(
      AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES,
      {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        chunks: [],
        jsonBody: {
          output_text: '',
          output: [{ type: 'message', content: [{ type: 'output_text', text: '' }] }],
        },
        wroteBody: true,
        bodyStartedBeforeFailure: false,
        ended: true,
      }
    )
  ).toMatchObject({ parsed: true, empty: true });

  expect(
    inspectAIRouterBufferedResponseContent(
      AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES,
      {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        chunks: [],
        jsonBody: {
          content: [{ type: 'text', text: '   ' }],
        },
        wroteBody: true,
        bodyStartedBeforeFailure: false,
        ended: true,
      }
    )
  ).toMatchObject({ parsed: true, empty: true });
});
```

- [ ] **Step 2: Run the server test and verify it fails**

Run: `pnpm vitest run src/server/model/aiRouter.spec.ts -t "AI Router buffered attempt mapping"`

Expected: FAIL because `inspectAIRouterBufferedResponseContent` is not exported.

- [ ] **Step 3: Add the inspection helper**

In `src/server/model/aiRouter.ts`, after `readJsonErrorMessage`, add:

```ts
export interface AIRouterBufferedContentInspection {
  parsed: boolean;
  empty: boolean;
  hasToolWork: boolean;
  text: string;
}

export function inspectAIRouterBufferedResponseContent(
  protocol: AIRouterProtocol,
  snapshot: BufferedResponseSnapshot
): AIRouterBufferedContentInspection {
  const fromJson = inspectAIRouterJsonContent(protocol, snapshot.jsonBody);

  if (fromJson.parsed) {
    return fromJson;
  }

  return inspectAIRouterSSEContent(protocol, snapshot.chunks);
}

function inspectAIRouterJsonContent(
  protocol: AIRouterProtocol,
  value: unknown
): AIRouterBufferedContentInspection {
  if (!value || typeof value !== 'object') {
    return emptyUnparsedAIRouterContentInspection();
  }

  const body = value as Record<string, any>;

  if (protocol === AI_ROUTER_PROTOCOLS.OPENAI_CHAT) {
    const choices = Array.isArray(body.choices) ? body.choices : null;

    if (!choices) {
      return emptyUnparsedAIRouterContentInspection();
    }

    const text = choices
      .map((choice) => choice?.message?.content)
      .filter((content) => typeof content === 'string')
      .join('');
    const hasToolWork = choices.some(
      (choice) =>
        Array.isArray(choice?.message?.tool_calls) ||
        Boolean(choice?.message?.function_call)
    );

    return parsedAIRouterContentInspection(text, hasToolWork);
  }

  if (protocol === AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES) {
    const hasDirectText = typeof body.output_text === 'string';
    const directText = hasDirectText ? body.output_text : '';
    const output = Array.isArray(body.output) ? body.output : null;

    if (!hasDirectText && !output) {
      return emptyUnparsedAIRouterContentInspection();
    }

    const outputText = (output ?? [])
      .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
      .map((content) => {
        if (typeof content?.text === 'string') {
          return content.text;
        }

        if (typeof content?.text?.value === 'string') {
          return content.text.value;
        }

        return '';
      })
      .join('');
    const hasToolWork = (output ?? []).some((item) =>
      ['function_call', 'tool_call', 'web_search_call', 'computer_call'].includes(
        String(item?.type ?? '')
      )
    );

    return parsedAIRouterContentInspection(
      hasDirectText ? directText : outputText,
      hasToolWork
    );
  }

  if (protocol === AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES) {
    const content = Array.isArray(body.content) ? body.content : null;

    if (!content) {
      return emptyUnparsedAIRouterContentInspection();
    }

    const text = content
      .filter((block) => block?.type === 'text')
      .map((block) => (typeof block?.text === 'string' ? block.text : ''))
      .join('');
    const hasToolWork = content.some((block) => block?.type === 'tool_use');

    return parsedAIRouterContentInspection(text, hasToolWork);
  }

  return emptyUnparsedAIRouterContentInspection();
}

function inspectAIRouterSSEContent(
  protocol: AIRouterProtocol,
  chunks: Buffer[]
): AIRouterBufferedContentInspection {
  const text = Buffer.concat(chunks).toString('utf8');

  if (!text.trim()) {
    return emptyUnparsedAIRouterContentInspection();
  }

  const events = parseAIRouterSSEJsonEvents(text);

  if (events.length === 0) {
    return emptyUnparsedAIRouterContentInspection();
  }

  if (protocol === AI_ROUTER_PROTOCOLS.OPENAI_CHAT) {
    const content = events
      .map((event) => event?.choices?.[0]?.delta?.content)
      .filter((value) => typeof value === 'string')
      .join('');
    const hasToolWork = events.some((event) =>
      Array.isArray(event?.choices?.[0]?.delta?.tool_calls) ||
      Boolean(event?.choices?.[0]?.delta?.function_call)
    );

    return parsedAIRouterContentInspection(content, hasToolWork);
  }

  if (protocol === AI_ROUTER_PROTOCOLS.OPENAI_RESPONSES) {
    const content = events
      .map((event) =>
        event?.type === 'response.output_text.delta' &&
        typeof event.delta === 'string'
          ? event.delta
          : ''
      )
      .join('');
    const hasToolWork = events.some((event) =>
      ['response.function_call_arguments.delta', 'response.output_item.done'].includes(
        String(event?.type ?? '')
      ) &&
      ['function_call', 'tool_call', 'web_search_call', 'computer_call'].includes(
        String(event?.item?.type ?? event?.output_item?.type ?? '')
      )
    );

    return parsedAIRouterContentInspection(content, hasToolWork);
  }

  if (protocol === AI_ROUTER_PROTOCOLS.ANTHROPIC_MESSAGES) {
    const content = events
      .map((event) =>
        event?.type === 'content_block_delta' &&
        event?.delta?.type === 'text_delta' &&
        typeof event.delta.text === 'string'
          ? event.delta.text
          : ''
      )
      .join('');
    const hasToolWork = events.some(
      (event) =>
        event?.type === 'content_block_start' &&
        event?.content_block?.type === 'tool_use'
    );

    return parsedAIRouterContentInspection(content, hasToolWork);
  }

  return emptyUnparsedAIRouterContentInspection();
}

function parseAIRouterSSEJsonEvents(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice(6).trim())
    .filter((data) => data && data !== '[DONE]')
    .flatMap((data) => {
      try {
        return [JSON.parse(data)];
      } catch {
        return [];
      }
    });
}

function parsedAIRouterContentInspection(
  text: string,
  hasToolWork: boolean
): AIRouterBufferedContentInspection {
  const normalizedText = text.trim();

  return {
    parsed: true,
    empty: !hasToolWork && normalizedText.length === 0,
    hasToolWork,
    text: normalizedText,
  };
}

function emptyUnparsedAIRouterContentInspection(): AIRouterBufferedContentInspection {
  return {
    parsed: false,
    empty: false,
    hasToolWork: false,
    text: '',
  };
}
```

- [ ] **Step 4: Run the focused tests**

Run: `pnpm vitest run src/server/model/aiRouter.spec.ts -t "AI Router buffered attempt mapping"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/model/aiRouter.ts src/server/model/aiRouter.spec.ts
git commit -m "test(ai-router): cover empty content inspection"
```

## Task 4: Convert Empty Buffered Responses Into Retryable Failures

**Files:**
- Modify: `src/server/model/aiRouter.ts`
- Modify: `src/server/model/aiRouter.spec.ts`

- [ ] **Step 1: Add failing tests for empty content attempt mapping**

In `src/server/model/aiRouter.spec.ts`, add these tests inside `describe('AI Router buffered attempt mapping', () => { ... })`:

```ts
test('converts opted-in empty content into an uncommitted retryable failure', () => {
  const result = buildBufferedAIGatewayAttemptResult({
    protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
    failOnEmptyContent: true,
    gatewayId: 'gw-empty',
    logId: 'log-empty',
    response: {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      chunks: [Buffer.from('{"choices":[{"message":{"content":""}}]}')],
      jsonBody: {
        choices: [{ message: { role: 'assistant', content: '' } }],
      },
      wroteBody: true,
      bodyStartedBeforeFailure: false,
      ended: true,
    },
  });

  expect(result).toMatchObject({
    ok: false,
    committed: false,
    gatewayId: 'gw-empty',
    logId: 'log-empty',
    statusCode: 502,
    failure: {
      message: 'AI Router gateway returned empty content',
      errorType: 'empty_content',
    },
  });
});

test('allows empty content when failOnEmptyContent is disabled', () => {
  const result = buildBufferedAIGatewayAttemptResult({
    protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
    failOnEmptyContent: false,
    gatewayId: 'gw-empty',
    response: {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      chunks: [Buffer.from('{"choices":[{"message":{"content":""}}]}')],
      jsonBody: {
        choices: [{ message: { role: 'assistant', content: '' } }],
      },
      wroteBody: true,
      bodyStartedBeforeFailure: false,
      ended: true,
    },
  });

  expect(result).toMatchObject({
    ok: true,
    committed: true,
    gatewayId: 'gw-empty',
    statusCode: 200,
  });
});
```

- [ ] **Step 2: Add a failing orchestration test for failover and logs**

In `src/server/model/aiRouter.spec.ts`, add this test inside `describe('AI Router orchestration', () => { ... })`:

```ts
test('fails over and logs empty_content when an opted-in route returns empty content', async () => {
  const attemptedGatewayIds: string[] = [];
  const createdLogs: any[] = [];

  const result = await runAIRouterAttempts({
    workspaceId: 'workspace1',
    routerId: 'router1',
    protocol: AI_ROUTER_PROTOCOLS.OPENAI_CHAT,
    requestPayload: {
      model: 'original-model',
      messages: [{ role: 'user', content: 'hello' }],
    },
    loadRouter: async () => ({
      id: 'router1',
      nodes: [
        {
          id: 'node-empty',
          gatewayId: 'gw-empty',
          provider: 'openai',
          enabled: true,
          order: 0,
          weight: 100,
          modelOverride: null,
          timeoutMs: 30000,
          retryableStatusCodes: [],
          failOnEmptyContent: true,
          gateway: {
            id: 'gw-empty',
            modelApiKey: 'sk-empty',
          },
        },
        {
          id: 'node-good',
          gatewayId: 'gw-good',
          provider: 'openai',
          enabled: true,
          order: 1,
          weight: 100,
          modelOverride: null,
          timeoutMs: 30000,
          retryableStatusCodes: [],
          failOnEmptyContent: true,
          gateway: {
            id: 'gw-good',
            modelApiKey: 'sk-good',
          },
        },
      ],
    }),
    executeAttempt: async ({ node }) => {
      attemptedGatewayIds.push(node.gatewayId);

      if (node.gatewayId === 'gw-empty') {
        return {
          ok: false,
          committed: false,
          gatewayId: 'gw-empty',
          statusCode: 502,
          logId: 'log-empty',
          failure: {
            message: 'AI Router gateway returned empty content',
            errorType: 'empty_content',
          },
        };
      }

      return {
        ok: true,
        committed: true,
        gatewayId: 'gw-good',
        statusCode: 200,
        logId: 'log-good',
      };
    },
    createLog: async (data) => {
      createdLogs.push(data);
      return {
        id: 'router-log1',
        ...data,
      };
    },
    now: () => 1000,
    random: () => 0,
  });

  expect(attemptedGatewayIds).toEqual(['gw-empty', 'gw-good']);
  expect(result.result).toMatchObject({
    ok: true,
    gatewayId: 'gw-good',
  });
  expect(createdLogs[0]).toMatchObject({
    status: AIRouterLogsStatus.Success,
    finalGatewayId: 'gw-good',
    finalGatewayLogId: 'log-good',
    attemptGatewayIds: ['gw-empty', 'gw-good'],
    attemptGatewayLogIds: ['log-empty', 'log-good'],
    attemptCount: 2,
  });
  expect(createdLogs[0].attemptErrors).toEqual([
    {
      gatewayId: 'gw-empty',
      gatewayLogId: 'log-empty',
      statusCode: 502,
      retryable: true,
      errorType: 'empty_content',
      message: 'AI Router gateway returned empty content',
    },
    {
      gatewayId: 'gw-good',
      gatewayLogId: 'log-good',
      statusCode: 200,
      retryable: false,
    },
  ]);
});
```

- [ ] **Step 3: Run the focused tests and verify they fail**

Run: `pnpm vitest run src/server/model/aiRouter.spec.ts -t "empty content"`

Expected: FAIL because `buildBufferedAIGatewayAttemptResult` does not accept `protocol` or `failOnEmptyContent` yet.

- [ ] **Step 4: Extend node and result args**

In `src/server/model/aiRouter.ts`, update `AIRouterAttemptNode`:

```ts
export interface AIRouterAttemptNode extends AIRouterNodeEligibility {
  id: string;
  gatewayId: string;
  provider?: string | null;
  weight?: number | null;
  modelOverride?: string | null;
  timeoutMs?: number | null;
  retryableStatusCodes?: number[];
  failOnEmptyContent?: boolean | null;
  gateway: (AIRouterGatewayEligibility & { id: string }) | null;
}
```

Update `buildBufferedAIGatewayAttemptResult` args:

```ts
export function buildBufferedAIGatewayAttemptResult(args: {
  gatewayId: string;
  logId?: string;
  protocol?: AIRouterProtocol;
  failOnEmptyContent?: boolean | null;
  response?: BufferedResponseSnapshot;
  error?: unknown;
}): BufferedAIRouterAttemptResult {
```

- [ ] **Step 5: Add empty response conversion**

In `buildBufferedAIGatewayAttemptResult`, after the `ok` calculation and before the returned object, add:

```ts
  const emptyContentFailure =
    ok &&
    args.failOnEmptyContent === true &&
    args.protocol &&
    isAIRouterBufferedResponseEmptyContent(args.protocol, args.response);

  if (emptyContentFailure) {
    return {
      ok: false,
      committed: false,
      gatewayId: args.gatewayId,
      logId: args.logId,
      statusCode: 502,
      failure: {
        message: 'AI Router gateway returned empty content',
        errorType: 'empty_content',
      },
      response: args.response,
    };
  }
```

Add this helper near the inspection helpers:

```ts
function isAIRouterBufferedResponseEmptyContent(
  protocol: AIRouterProtocol,
  snapshot: BufferedResponseSnapshot
) {
  const inspection = inspectAIRouterBufferedResponseContent(protocol, snapshot);

  return inspection.parsed && inspection.empty;
}
```

- [ ] **Step 6: Pass protocol and node config from runtime attempts**

In `executeBufferedAIGatewayAttempt`, include the new args in both success and error result building:

```ts
return buildBufferedAIGatewayAttemptResult({
  gatewayId: args.node.gatewayId,
  logId,
  protocol: args.protocol,
  failOnEmptyContent: args.node.failOnEmptyContent,
  response,
});
```

In the `catch` block, pass the same fields:

```ts
return buildBufferedAIGatewayAttemptResult({
  gatewayId: args.node.gatewayId,
  logId,
  protocol: args.protocol,
  failOnEmptyContent: args.node.failOnEmptyContent,
  error,
  response: bufferedResponse.wroteBody
    ? bufferedResponse.snapshot()
    : undefined,
});
```

To make that compile, add `protocol` to `executeBufferedAIGatewayAttempt` args:

```ts
async function executeBufferedAIGatewayAttempt(args: {
  req: Request;
  protocol: AIRouterProtocol;
  node: AIRouterAttemptNode;
  payload: Record<string, unknown>;
  gatewayHandler: RequestHandler;
}): Promise<BufferedAIRouterAttemptResult> {
```

Update the call site in `buildAIRouterRuntimeHandler`:

```ts
return executeBufferedAIGatewayAttempt({
  req,
  protocol: args.protocol,
  node,
  payload,
  gatewayHandler,
});
```

- [ ] **Step 7: Run the focused tests**

Run: `pnpm vitest run src/server/model/aiRouter.spec.ts -t "empty content"`

Expected: PASS.

- [ ] **Step 8: Run the full AI Router server test**

Run: `pnpm vitest run src/server/model/aiRouter.spec.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/server/model/aiRouter.ts src/server/model/aiRouter.spec.ts
git commit -m "feat(ai-router): fail over empty content responses"
```

## Task 5: Document The Route Option

**Files:**
- Modify: `website/docs/ai-router/intro.md`

- [ ] **Step 1: Add documentation for the setting**

In `website/docs/ai-router/intro.md`, after the `Retryable Status Codes` section, add:

```md
### Fail on Empty Content

Fail on Empty Content is optional and defaults to off.

When enabled for a gateway route, AI Router treats a successful upstream
response with no assistant text content as a failed attempt. It then tries the
next eligible route in the same tier, followed by lower tiers if needed.

Tool-only responses are still treated as valid responses. This prevents
function calling or tool-use requests from failing only because they did not
produce assistant text.
```

- [ ] **Step 2: Run markdown-sensitive checks through build**

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add website/docs/ai-router/intro.md
git commit -m "docs(ai-router): explain empty content failover"
```

## Task 6: Final Verification

**Files:**
- Verify only; no planned edits.

- [ ] **Step 1: Run targeted AI Router tests**

Run: `pnpm vitest run src/server/model/aiRouter.spec.ts src/client/components/aiRouter/AIRouterRouteEditor.component.spec.tsx`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `pnpm check:type`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 4: Inspect final diff**

Run: `git diff --stat HEAD~4..HEAD`

Expected: includes only AI Router schema, migration, route editor, tests, runtime, and docs files.

- [ ] **Step 5: Leave a clean worktree**

Run: `git status --short`

Expected: no output.
