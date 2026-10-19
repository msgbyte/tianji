# LLM Generated Data CI Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic `pnpm check:llm` command to validate committed LLM model JSON files during pushes to `master`.

**Architecture:** A side-effect-free server utility owns the Zod schemas and canonical JSON validation. A thin root script reads the two committed files, and both the fetcher and CI reuse the same v2 schema so generation-time and CI-time validation cannot drift.

**Tech Stack:** TypeScript 5.7, Zod 4, Vitest 3, pnpm, GitHub Actions.

## Global Constraints

- Do not modify JSON files under `src/client/public/locales`.
- Do not fetch upstream LLM data during validation.
- Keep the existing CI trigger on pushes to `master`.
- Preserve the user's existing changes to both generated LLM JSON files.
- Require canonical two-space JSON with a trailing newline.

---

### Task 1: Side-effect-free LLM data validator

**Files:**
- Create: `src/server/utils/llmModelDataSchema.ts`
- Create: `src/server/utils/__tests__/llmModelDataSchema.test.ts`

**Interfaces:**
- Produces: `llmModelDataV1Schema` and `llmModelDataV2Schema` Zod schemas.
- Produces: `validateCanonicalJson<T>(source: string, schema: z.ZodType<T>): T`.

- [ ] **Step 1: Write the failing validator tests**

Create tests using small inline fixtures:

```ts
import { describe, expect, it } from 'vitest';
import {
  llmModelDataV1Schema,
  llmModelDataV2Schema,
  validateCanonicalJson,
} from '../llmModelDataSchema.js';

const canonical = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

describe('LLM model data validation', () => {
  it('accepts canonical v1 and v2 documents', () => {
    const v1 = { 'gpt-test': { input_cost_per_token: 1 } };
    const v2 = {
      openai: {
        name: 'OpenAI',
        models: { 'gpt-test': { id: 'gpt-test', name: 'GPT Test' } },
      },
    };
    expect(validateCanonicalJson(canonical(v1), llmModelDataV1Schema)).toEqual(v1);
    expect(validateCanonicalJson(canonical(v2), llmModelDataV2Schema)).toEqual(v2);
  });

  it('rejects non-canonical formatting', () => {
    expect(() => validateCanonicalJson('{"gpt-test":{}}\n', llmModelDataV1Schema))
      .toThrow('canonical two-space JSON');
  });

  it('rejects empty and structurally invalid documents', () => {
    expect(() => validateCanonicalJson('{}\n', llmModelDataV1Schema)).toThrow();
    const invalid = { openai: { name: 'OpenAI', models: { broken: { name: 'Broken' } } } };
    expect(() => validateCanonicalJson(canonical(invalid), llmModelDataV2Schema)).toThrow();
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --dir src/server exec vitest run utils/__tests__/llmModelDataSchema.test.ts`

Expected: FAIL because `../llmModelDataSchema.js` does not exist.

- [ ] **Step 3: Implement the minimal schemas and validator**

```ts
import { z } from 'zod';

const nonEmptyRecord = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.record(z.string(), valueSchema).refine(
    (value) => Object.keys(value).length > 0,
    'document must not be empty'
  );

export const llmModelDataV1Schema = nonEmptyRecord(
  z.record(z.string(), z.unknown())
);

export const llmModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  cost: z.object({
    input: z.number().optional(),
    output: z.number().optional(),
  }).passthrough().optional(),
  limit: z.object({
    context: z.number().optional(),
    output: z.number().optional(),
  }).passthrough().optional(),
}).passthrough();

export const llmProviderSchema = z.object({
  name: z.string(),
  models: z.record(z.string(), llmModelSchema),
}).passthrough();

export const llmModelDataV2Schema = nonEmptyRecord(llmProviderSchema);

export type LLMModelData = z.infer<typeof llmModelDataV2Schema>;
export type LLMProvider = z.infer<typeof llmProviderSchema>;
export type LLMModel = z.infer<typeof llmModelSchema>;

export function validateCanonicalJson<T>(
  source: string,
  schema: z.ZodType<T>
): T {
  const parsed: unknown = JSON.parse(source);
  const canonical = `${JSON.stringify(parsed, null, 2)}\n`;
  if (source !== canonical) {
    throw new Error('expected canonical two-space JSON with a trailing newline');
  }
  return schema.parse(parsed);
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm --dir src/server exec vitest run utils/__tests__/llmModelDataSchema.test.ts`

Expected: PASS, 3 tests passed.

- [ ] **Step 5: Commit the validator unit**

```bash
git add src/server/utils/llmModelDataSchema.ts src/server/utils/__tests__/llmModelDataSchema.test.ts
git diff --cached --check
git commit -m "test: add llm model data validation"
```

### Task 2: CLI, fetcher reuse, and CI wiring

**Files:**
- Create: `scripts/check-llm-model.ts`
- Modify: `scripts/fetch-llm-model-v2.ts`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yaml`

**Interfaces:**
- Consumes: `llmModelDataV1Schema`, `llmModelDataV2Schema`, and `validateCanonicalJson` from Task 1.
- Produces: root command `pnpm check:llm` with a non-zero exit code on validation failure.

- [ ] **Step 1: Create the thin validation CLI**

```ts
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  llmModelDataV1Schema,
  llmModelDataV2Schema,
  validateCanonicalJson,
} from '../src/server/utils/llmModelDataSchema.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  ['src/server/utils/model_prices_and_context_window.json', llmModelDataV1Schema],
  ['src/server/utils/model_prices_and_context_window_v2.json', llmModelDataV2Schema],
] as const;

for (const [relativePath, schema] of targets) {
  try {
    const source = await fs.readFile(path.join(repoRoot, relativePath), 'utf8');
    validateCanonicalJson(source, schema);
    console.log(`Validated ${relativePath}`);
  } catch (error) {
    throw new Error(`Invalid ${relativePath}`, { cause: error });
  }
}
```

- [ ] **Step 2: Reuse the exported v2 schema in the fetcher**

Delete the local `modelSchema`, `providerSchema`, and `llmModelDataSchema`, then add:

```ts
import { llmModelDataV2Schema } from '../src/server/utils/llmModelDataSchema.js';
export type {
  LLMModel,
  LLMModelData,
  LLMProvider,
} from '../src/server/utils/llmModelDataSchema.js';
```

Replace `llmModelDataSchema.parse(raw)` with:

```ts
llmModelDataV2Schema.parse(raw);
```

- [ ] **Step 3: Add the package command and CI step**

Add `"check:llm": "tsx scripts/check-llm-model.ts"` to root scripts. Add the following after dependency installation in `.github/workflows/ci.yaml`:

```yaml
      - name: Check LLM model data
        run: pnpm check:llm
```

- [ ] **Step 4: Verify the integration**

```bash
pnpm check:llm
pnpm --dir src/server exec vitest run utils/__tests__/llmModelDataSchema.test.ts
pnpm --filter @tianji/server check:type
```

Expected: both validation success lines, 3 passing tests, and type-check exit code 0.

- [ ] **Step 5: Commit without generated JSON files**

```bash
git add scripts/check-llm-model.ts scripts/fetch-llm-model-v2.ts package.json .github/workflows/ci.yaml
git diff --cached --name-only
git diff --cached --check
git commit -m "ci: validate generated llm model data"
```

### Task 3: Final scope and verification audit

**Files:**
- Verify only; no new files.

**Interfaces:**
- Consumes: the validator and CI command from Tasks 1 and 2.
- Produces: verification evidence and a clean implementation scope.

- [ ] **Step 1: Run final verification**

```bash
pnpm check:llm
pnpm --dir src/server exec vitest run utils/__tests__/llmModelDataSchema.test.ts
pnpm --filter @tianji/server check:type
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 2: Audit repository state**

Run: `git status --short && git log -3 --oneline`

Expected: only the user's two generated JSON files remain modified; implementation commits are visible at HEAD.
