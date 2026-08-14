# Function Worker Environment Variables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-Function Worker Text and write-only Secret environment variables, expose them to worker code through `context.env`, and manage them safely from the existing Worker form.

**Architecture:** Store variables in a dedicated Prisma relation so normal Worker queries cannot accidentally return values. Centralize validation, safe DTO conversion, transactional synchronization, and runtime resolution in `model/worker/environment.ts`; all stored execution paths load current values immediately before invoking the isolated VM. The client uses a focused field-array component, while the Worker router exposes only redacted DTOs and accepts optional environment collections for backward compatibility.

**Tech Stack:** TypeScript 5.7, Prisma/PostgreSQL, tRPC, Zod 4, React 18, React Hook Form, Vitest, Testing Library, isolated-vm.

## Global Constraints

- Runtime access is `context.env.KEY`; do not expose Node.js `process` in the isolate.
- Text values are readable and writable through management API/UI.
- Secret values are writable and replaceable but are never returned by management API/UI.
- Omitting a saved Secret value preserves it; changing its type requires a replacement value.
- Secret storage encryption and key rotation are out of scope.
- Do not modify JSON files under `src/client/public/locales`.
- Preserve existing worker callers by making the new environment collection optional on update.

---

### Task 1: Environment Variable Domain Model and Safe DTO

**Files:**
- Create: `src/server/model/worker/environment.spec.ts`
- Create: `src/server/model/worker/environment.ts`
- Modify: `src/server/prisma/schema.prisma`
- Create: `src/server/prisma/migrations/20260815000000_add_function_worker_environment_variables/migration.sql`
- Generated: `src/server/prisma/zod/functionworkerenvironmentvariable.ts`
- Generated: `src/server/prisma/zod/functionworker.ts`
- Generated: `src/server/prisma/zod/index.ts`

**Interfaces:**
- Produces: `WorkerEnvironmentVariableInput`, `SafeWorkerEnvironmentVariable`, `workerEnvironmentVariableInputSchema`, `workerEnvironmentVariablesInputSchema`, `toSafeWorkerEnvironmentVariable(row)`.
- Produces Prisma enum: `FunctionWorkerEnvironmentVariableType.Text | Secret`.

- [ ] **Step 1: Write the failing safe-DTO and validation tests**

Create `environment.spec.ts` with direct tests of the intended public helpers:

```ts
import { describe, expect, test } from 'vitest';
import {
  toSafeWorkerEnvironmentVariable,
  workerEnvironmentVariablesInputSchema,
} from './environment.js';

describe('worker environment variable contract', () => {
  test('returns a Text value', () => {
    expect(
      toSafeWorkerEnvironmentVariable({
        id: 'env_text',
        key: 'API_URL',
        type: 'Text',
        value: 'https://example.com',
      })
    ).toEqual({
      id: 'env_text',
      key: 'API_URL',
      type: 'Text',
      value: 'https://example.com',
    });
  });

  test('omits a Secret value from the response object', () => {
    const result = toSafeWorkerEnvironmentVariable({
      id: 'env_secret',
      key: 'API_TOKEN',
      type: 'Secret',
      value: 'do-not-return',
    });

    expect(result).toEqual({
      id: 'env_secret',
      key: 'API_TOKEN',
      type: 'Secret',
      hasValue: true,
    });
    expect(JSON.stringify(result)).not.toContain('do-not-return');
    expect(result).not.toHaveProperty('value');
  });

  test.each(['1TOKEN', 'API-TOKEN', 'API TOKEN'])('rejects invalid key %s', (key) => {
    expect(() =>
      workerEnvironmentVariablesInputSchema.parse([
        { key, type: 'Text', value: 'value' },
      ])
    ).toThrow();
  });

  test('rejects duplicate keys', () => {
    expect(() =>
      workerEnvironmentVariablesInputSchema.parse([
        { key: 'API_URL', type: 'Text', value: 'one' },
        { key: 'API_URL', type: 'Secret', value: 'two' },
      ])
    ).toThrow('Environment variable keys must be unique');
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --dir src/server exec vitest run model/worker/environment.spec.ts`

Expected: FAIL because `./environment.js` does not exist.

- [ ] **Step 3: Add the Prisma model and migration**

Add the enum, relation, and model to `schema.prisma`:

```prisma
enum FunctionWorkerEnvironmentVariableType {
  Text
  Secret
}

model FunctionWorkerEnvironmentVariable {
  id        String                                @id @default(cuid()) @db.VarChar(30)
  workerId  String                                @db.VarChar(30)
  key       String                                @db.VarChar(255)
  type      FunctionWorkerEnvironmentVariableType
  value     String
  createdAt DateTime                              @default(now()) @db.Timestamptz(6)
  updatedAt DateTime                              @updatedAt @db.Timestamptz(6)

  worker FunctionWorker @relation(fields: [workerId], references: [id], onUpdate: Cascade, onDelete: Cascade)

  @@unique([workerId, key])
  @@index([workerId])
}
```

Add `environmentVariables FunctionWorkerEnvironmentVariable[]` to `FunctionWorker`. Write matching SQL that creates the enum/table, unique index, worker index, and cascade foreign key.

- [ ] **Step 4: Implement the input schemas and safe DTO converter**

Create `environment.ts` with discriminated inputs and outputs:

```ts
import { z } from 'zod';

const environmentKeySchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'Invalid environment variable key');

export const workerEnvironmentVariableInputSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().cuid2().optional(),
    key: environmentKeySchema,
    type: z.literal('Text'),
    value: z.string(),
  }),
  z.object({
    id: z.string().cuid2().optional(),
    key: environmentKeySchema,
    type: z.literal('Secret'),
    value: z.string().optional(),
  }),
]);

export const workerEnvironmentVariablesInputSchema = z
  .array(workerEnvironmentVariableInputSchema)
  .superRefine((items, ctx) => {
    const keys = new Set<string>();
    items.forEach((item, index) => {
      if (keys.has(item.key)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Environment variable keys must be unique',
          path: [index, 'key'],
        });
      }
      keys.add(item.key);
    });
  });

export type WorkerEnvironmentVariableInput = z.infer<
  typeof workerEnvironmentVariableInputSchema
>;

export type SafeWorkerEnvironmentVariable =
  | { id: string; key: string; type: 'Text'; value: string }
  | { id: string; key: string; type: 'Secret'; hasValue: boolean };
```

Implement `toSafeWorkerEnvironmentVariable` with explicit object construction; never spread the database row into a Secret response.

- [ ] **Step 5: Generate Prisma client/Zod output and verify GREEN**

Run:

```bash
pnpm --dir src/server db:generate
pnpm --dir src/server exec vitest run model/worker/environment.spec.ts
```

Expected: Prisma generation succeeds and the focused test passes.

- [ ] **Step 6: Commit the domain contract**

```bash
git add src/server/prisma/schema.prisma src/server/prisma/migrations/20260815000000_add_function_worker_environment_variables/migration.sql src/server/prisma/zod src/server/model/worker/environment.ts src/server/model/worker/environment.spec.ts
git commit -m "feat(worker): add environment variable model"
```

### Task 2: Transactional Persistence and Secret Replacement

**Files:**
- Modify: `src/server/model/worker/environment.spec.ts`
- Modify: `src/server/model/worker/environment.ts`
- Modify: `src/server/model/worker/cronManager.ts`
- Modify: `src/server/model/worker/cronManager.spec.ts`

**Interfaces:**
- Consumes: `WorkerEnvironmentVariableInput` from Task 1.
- Produces: `syncWorkerEnvironmentVariables(tx, workerId, inputs): Promise<void>`.
- Changes: `WorkerCronUpsertData.environmentVariables?: WorkerEnvironmentVariableInput[]`.

- [ ] **Step 1: Write failing synchronization tests**

Add tests with a fake transaction client that assert these exact behaviors:

```ts
test('preserves an existing Secret when replacement value is omitted', async () => {
  tx.functionWorkerEnvironmentVariable.findMany.mockResolvedValue([
    { id: 'env_secret', workerId: 'worker-a', key: 'TOKEN', type: 'Secret', value: 'old' },
  ]);

  await syncWorkerEnvironmentVariables(tx, 'worker-a', [
    { id: 'env_secret', key: 'TOKEN', type: 'Secret' },
  ]);

  expect(tx.functionWorkerEnvironmentVariable.update).toHaveBeenCalledWith({
    where: { id: 'env_secret', workerId: 'worker-a' },
    data: { key: 'TOKEN', type: 'Secret' },
  });
});

test('replaces an existing Secret without returning it', async () => {
  tx.functionWorkerEnvironmentVariable.findMany.mockResolvedValue([
    { id: 'env_secret', workerId: 'worker-a', key: 'TOKEN', type: 'Secret', value: 'old' },
  ]);

  await syncWorkerEnvironmentVariables(tx, 'worker-a', [
    { id: 'env_secret', key: 'TOKEN', type: 'Secret', value: 'new' },
  ]);

  expect(tx.functionWorkerEnvironmentVariable.update).toHaveBeenCalledWith({
    where: { id: 'env_secret', workerId: 'worker-a' },
    data: { key: 'TOKEN', type: 'Secret', value: 'new' },
  });
});

test('rejects a new Secret without a value', async () => {
  await expect(
    syncWorkerEnvironmentVariables(tx, 'worker-a', [
      { key: 'TOKEN', type: 'Secret' },
    ])
  ).rejects.toThrow('A value is required for a new Secret');
});

test('rejects a type change without a replacement value', async () => {
  tx.functionWorkerEnvironmentVariable.findMany.mockResolvedValue([
    { id: 'env_text', workerId: 'worker-a', key: 'TOKEN', type: 'Text', value: 'old' },
  ]);

  await expect(
    syncWorkerEnvironmentVariables(tx, 'worker-a', [
      { id: 'env_text', key: 'TOKEN', type: 'Secret' },
    ])
  ).rejects.toThrow('A value is required when changing variable type');
});
```

In `cronManager.spec.ts`, add one test proving `environmentVariables` is synchronized inside the same `$transaction` callback as the worker update, and another proving omitted `environmentVariables` does not invoke synchronization for legacy callers.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `pnpm --dir src/server exec vitest run model/worker/environment.spec.ts model/worker/cronManager.spec.ts`

Expected: FAIL because synchronization and manager integration are missing.

- [ ] **Step 3: Implement transactional synchronization**

Inside `syncWorkerEnvironmentVariables`:

1. Read all existing rows for `workerId`.
2. Reject submitted IDs not present in that worker.
3. Delete existing rows whose IDs are absent from the submitted collection.
4. Create rows without IDs, requiring a value for Secret.
5. Update rows with IDs; omit `value` from the update data only for a same-type Secret with no replacement.
6. Require a submitted value whenever the type changes.

Use explicit `create`, `update`, and `deleteMany` calls instead of an unchecked bulk upsert so worker ownership and preserve-vs-replace semantics remain visible.

- [ ] **Step 4: Integrate synchronization into `WorkerCronManager.upsert`**

Extend `WorkerCronUpsertData` with optional `environmentVariables`. Remove it before spreading worker scalar data. For create, treat omission as an empty collection; for update, omission means leave current environment untouched. Call `syncWorkerEnvironmentVariables(tx, worker.id, environmentVariables)` within the existing Prisma transaction.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `pnpm --dir src/server exec vitest run model/worker/environment.spec.ts model/worker/cronManager.spec.ts`

Expected: all focused tests pass.

- [ ] **Step 6: Commit persistence behavior**

```bash
git add src/server/model/worker/environment.ts src/server/model/worker/environment.spec.ts src/server/model/worker/cronManager.ts src/server/model/worker/cronManager.spec.ts
git commit -m "feat(worker): persist environment variables"
```

### Task 3: Safe Management API

**Files:**
- Create: `src/server/trpc/routers/worker.spec.ts`
- Modify: `src/server/trpc/routers/worker.ts`

**Interfaces:**
- Consumes: Task 1 schemas/DTO converter and Task 2 manager input.
- Produces: `worker.getEnvironmentVariables({ workspaceId, workerId })`.
- Changes: `worker.upsert` and `worker.testCode` accept optional `environmentVariables`; `testCode` also accepts optional `workerId`.

- [ ] **Step 1: Write failing router tests**

Mock authentication, workspace ownership, Prisma, `workerCronManager`, and execution helpers following `aiGateway.spec.ts`. Add tests that prove:

```ts
test('returns Text values and no Secret values', async () => {
  prisma.functionWorker.findUnique.mockResolvedValue({ id: workerId });
  prisma.functionWorkerEnvironmentVariable.findMany.mockResolvedValue([
    { id: 'text', key: 'API_URL', type: 'Text', value: 'https://example.com' },
    { id: 'secret', key: 'TOKEN', type: 'Secret', value: 'never-return' },
  ]);

  const result = await caller.getEnvironmentVariables({ workspaceId, workerId });

  expect(result).toEqual([
    { id: 'text', key: 'API_URL', type: 'Text', value: 'https://example.com' },
    { id: 'secret', key: 'TOKEN', type: 'Secret', hasValue: true },
  ]);
  expect(JSON.stringify(result)).not.toContain('never-return');
});
```

Also assert a worker from another workspace returns `NOT_FOUND`, and assert `upsert` forwards validated environment inputs to `workerCronManager.upsert` without including secret values in its response.

- [ ] **Step 2: Run the router test and verify RED**

Run: `pnpm --dir src/server exec vitest run trpc/routers/worker.spec.ts`

Expected: FAIL because `getEnvironmentVariables` and the new input fields do not exist.

- [ ] **Step 3: Implement the safe query and write inputs**

Add `getEnvironmentVariables` as a `workspaceProcedure`. First verify the worker with `{ id: workerId, workspaceId }`, then query rows ordered by creation time, and map every row with `toSafeWorkerEnvironmentVariable`.

Extend `upsert` with `environmentVariables: workerEnvironmentVariablesInputSchema.optional()`. Pass the optional collection to the manager. Keep the output as `FunctionWorkerModelSchema`, never a Prisma row with included environment relations.

Extend `testCode` with optional `workerId` and environment inputs; Task 4 supplies the resolver used by this endpoint.

- [ ] **Step 4: Run the router test and verify GREEN**

Run: `pnpm --dir src/server exec vitest run trpc/routers/worker.spec.ts`

Expected: all worker router tests pass.

- [ ] **Step 5: Commit the management API**

```bash
git add src/server/trpc/routers/worker.ts src/server/trpc/routers/worker.spec.ts
git commit -m "feat(worker): expose safe environment api"
```

### Task 4: Runtime Environment Resolution

**Files:**
- Modify: `src/server/model/worker/environment.spec.ts`
- Modify: `src/server/model/worker/environment.ts`
- Modify: `src/server/model/worker/index.ts`
- Modify: `src/server/model/worker/index.spec.ts`
- Modify: `src/server/model/worker/cronRunner.ts`
- Create: `src/server/model/worker/cronRunner.spec.ts`
- Modify: `src/server/trpc/routers/worker.ts`
- Modify: `src/server/trpc/routers/worker.spec.ts`

**Interfaces:**
- Produces: `loadWorkerEnvironment(workerId): Promise<Record<string, string>>`.
- Produces: `resolveWorkerEnvironment(workerId?: string, drafts?): Promise<Record<string, string>>` for code testing.
- Produces: `execStoredWorker(worker, requestPayload?, context?): Promise<ExecutionResult>`.
- Changes: `execWorker(code, workerId?, requestPayload?, context?, environment = {})` injects environment as `__workerContext.env`.

- [ ] **Step 1: Write failing runtime tests**

In `index.spec.ts`, add:

```ts
test('passes environment variables through context.env without embedding values in source', async () => {
  await execWorker(
    'async function fetch(payload, context) { return context.env.TOKEN; }',
    undefined,
    undefined,
    { type: 'test' },
    { TOKEN: 'runtime-secret' }
  );

  const [source, globals] = vi.mocked(runCodeInIVM).mock.calls[0];
  expect(source).not.toContain('runtime-secret');
  expect(globals.__workerContext).toEqual({
    type: 'test',
    env: { TOKEN: 'runtime-secret' },
  });
});
```

In `environment.spec.ts`, mock Prisma and prove `loadWorkerEnvironment` returns both Text and Secret values as a plain map, and `resolveWorkerEnvironment` preserves an existing Secret when a draft omits its value.

In `cronRunner.spec.ts`, mock `execStoredWorker`, trigger the Cron callback, and assert the runner delegates its current worker with `{ type: 'cron' }` rather than calling `execWorker` directly.

In `worker.spec.ts`, assert manual execution calls `execStoredWorker(worker, payload, { type: 'manual' })`; test-code execution resolves draft/saved environment and passes it to `execWorker`.

- [ ] **Step 2: Run runtime tests and verify RED**

Run:

```bash
pnpm --dir src/server exec vitest run model/worker/environment.spec.ts model/worker/index.spec.ts model/worker/cronRunner.spec.ts trpc/routers/worker.spec.ts
```

Expected: FAIL because the loaders, stored-worker wrapper, and environment argument are missing.

- [ ] **Step 3: Implement loaders and draft resolution**

`loadWorkerEnvironment` selects only `key` and `value` and returns `Object.fromEntries(rows.map(({ key, value }) => [key, value]))`.

`resolveWorkerEnvironment` loads saved rows for an existing worker and applies the submitted collection as the desired test state. Same-type Secret drafts without `value` use the saved value; Text and explicit Secret values use the submitted value. New Secret drafts without values fail through the same validation path as persistence.

- [ ] **Step 4: Inject the map and centralize stored execution**

In `execWorker`, construct a fresh context object:

```ts
const workerContext = {
  ...(isPlainObject(context) ? context : {}),
  env: isPlainObject(environment) ? environment : {},
};
```

Pass it through the existing `__workerContext` global. Implement `execStoredWorker` to load current variables on every invocation and then call `execWorker`. Replace manual and Cron direct calls with this wrapper. Update `testCode` to use `resolveWorkerEnvironment` and pass the result to `execWorker` without persisting an execution record.

- [ ] **Step 5: Run runtime tests and verify GREEN**

Run the same four-file Vitest command from Step 2.

Expected: all focused tests pass.

- [ ] **Step 6: Commit runtime injection**

```bash
git add src/server/model/worker/environment.ts src/server/model/worker/environment.spec.ts src/server/model/worker/index.ts src/server/model/worker/index.spec.ts src/server/model/worker/cronRunner.ts src/server/model/worker/cronRunner.spec.ts src/server/trpc/routers/worker.ts src/server/trpc/routers/worker.spec.ts
git commit -m "feat(worker): inject runtime environment"
```

### Task 5: Worker Form Environment Editor

**Files:**
- Create: `src/client/components/worker/WorkerEnvironmentVariablesField.tsx`
- Create: `src/client/components/worker/WorkerEnvironmentVariablesField.component.spec.tsx`
- Modify: `src/client/components/worker/WorkerEditForm.tsx`
- Modify: `src/client/routes/worker/add.tsx`
- Modify: `src/client/routes/worker/$workerId/edit.tsx`

**Interfaces:**
- Consumes API DTOs from Task 3.
- Produces client form type `WorkerEnvironmentVariableFormValue` with `{ id?, key, type, value?, hasValue? }`.
- Changes `WorkerEditFormValues` to include `environmentVariables` and submit it through existing add/edit mutations.

- [ ] **Step 1: Write failing component tests**

Render the environment field within a real React Hook Form provider. Mock only translation and Radix Select plumbing. Cover these behaviors:

```ts
test('shows a Text value but never populates an existing Secret input', () => {
  renderEnvironmentFields([
    { id: 'text', key: 'API_URL', type: 'Text', value: 'https://example.com' },
    { id: 'secret', key: 'TOKEN', type: 'Secret', hasValue: true },
  ]);

  expect(screen.getByDisplayValue('https://example.com')).toBeVisible();
  expect(screen.getByLabelText('TOKEN value')).toHaveValue('');
  expect(screen.queryByDisplayValue('never-return')).not.toBeInTheDocument();
  expect(screen.getByText('A secret value is configured')).toBeVisible();
});

test('submits only an explicitly entered Secret replacement', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  renderEnvironmentFields(
    [{ id: 'secret', key: 'TOKEN', type: 'Secret', hasValue: true }],
    onSubmit
  );

  await user.type(screen.getByLabelText('TOKEN value'), 'replacement');
  await user.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSubmit).toHaveBeenCalledWith([
    {
      id: 'secret',
      key: 'TOKEN',
      type: 'Secret',
      hasValue: true,
      value: 'replacement',
    },
  ]);
});

test('adds and removes environment variable rows', async () => {
  const user = userEvent.setup();
  renderEnvironmentFields([]);

  await user.click(
    screen.getByRole('button', { name: 'Add Environment Variable' })
  );
  expect(screen.getByLabelText('Environment variable 1 key')).toBeVisible();

  await user.click(
    screen.getByRole('button', { name: 'Remove environment variable 1' })
  );
  expect(
    screen.queryByLabelText('Environment variable 1 key')
  ).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the component test and verify RED**

Run: `pnpm --dir src/client exec vitest run --config vitest.component.config.ts components/worker/WorkerEnvironmentVariablesField.component.spec.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the focused field-array component**

Use `useFormContext<WorkerEditFormValues>()` and `useFieldArray({ name: 'environmentVariables', keyName: 'fieldKey' })`. Render existing `Card`, `Input`, `Select`, and `Button` primitives. Use `type="password"` for Secret values. The configured-secret message depends only on `hasValue`; never synthesize a masked value.

When switching type, clear `value` and `hasValue` so the user must enter a fresh value. Add accessible labels derived from the row key or index and explicit Add/Remove button labels for testing and keyboard use.

- [ ] **Step 4: Integrate form schema, loading, submission, and code test**

Add `environmentVariables: z.array(...)` to `WorkerEditForm`'s schema and default it to `[]`. Insert the new component as a separate form section. When testing unsaved code on the add page, pass `form.getValues('environmentVariables')` to `worker.testCode`.

In the edit route, query `worker.getEnvironmentVariables` alongside `worker.get`, wait for both, and pass the safe rows as form defaults. Existing Secret rows therefore contain `hasValue: true` and no `value`. Add and edit routes already spread form values into `worker.upsert`; retain that path.

- [ ] **Step 5: Run component and client type tests and verify GREEN**

Run:

```bash
pnpm --dir src/client exec vitest run --config vitest.component.config.ts components/worker/WorkerEnvironmentVariablesField.component.spec.tsx
pnpm --filter @tianji/client check:type
```

Expected: focused component tests and client typecheck pass.

- [ ] **Step 6: Commit the UI**

```bash
git add src/client/components/worker/WorkerEnvironmentVariablesField.tsx src/client/components/worker/WorkerEnvironmentVariablesField.component.spec.tsx src/client/components/worker/WorkerEditForm.tsx src/client/routes/worker/add.tsx 'src/client/routes/worker/$workerId/edit.tsx'
git commit -m "feat(worker): manage environment variables"
```

### Task 6: Full Verification and Contract Audit

**Files:**
- Verify all files changed in Tasks 1-5.

**Interfaces:**
- Consumes all prior tasks.
- Produces fresh evidence for migration generation, tests, type safety, production build, secret non-disclosure, and diff hygiene.

- [ ] **Step 1: Run all focused server and client tests**

```bash
pnpm --dir src/server exec vitest run model/worker/environment.spec.ts model/worker/index.spec.ts model/worker/cronRunner.spec.ts model/worker/cronManager.spec.ts trpc/routers/worker.spec.ts
pnpm --dir src/client exec vitest run --config vitest.component.config.ts components/worker/WorkerEnvironmentVariablesField.component.spec.tsx
```

Expected: all listed suites pass with zero failures.

- [ ] **Step 2: Audit secret response construction and forbidden locale changes**

```bash
rg -n "toSafeWorkerEnvironmentVariable|getEnvironmentVariables|hasValue" src/server/model/worker src/server/trpc/routers/worker.ts
git diff HEAD~4 -- src/client/public/locales
```

Expected: Secret responses are built through the safe converter, and the locale diff is empty.

- [ ] **Step 3: Run CI-equivalent typecheck and build**

```bash
pnpm check:type
pnpm build
```

Expected: both commands exit 0. If an unrelated baseline failure occurs, record the exact command and error without presenting it as feature success.

- [ ] **Step 4: Check migration, generated files, and diff hygiene**

```bash
pnpm --dir src/server db:generate
git diff --exit-code -- src/server/prisma/zod
git diff --check
git status --short
```

Expected: regeneration creates no new diff, `git diff --check` exits 0, and status contains no unexpected files.

- [ ] **Step 5: Report the verified state**

Record the exact pass/fail count for focused tests, the exit status of `pnpm check:type` and `pnpm build`, and any remaining `git status --short` entries. Do not push or open a PR unless explicitly requested.
