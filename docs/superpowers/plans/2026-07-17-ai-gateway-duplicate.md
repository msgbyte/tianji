# AI Gateway Duplicate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an administrator-only duplicate action that copies an AI Gateway's configuration and API key entirely on the server.

**Architecture:** A dedicated `aiGateway.duplicate` mutation accepts only the source ID and new name, copies an explicitly selected set of scalar fields inside the current workspace, and returns only the new ID and name. The existing detail page owns a small dialog that calls the mutation, refreshes the list, and navigates to the duplicate.

**Tech Stack:** TypeScript, tRPC, Zod, Prisma, React, TanStack Router, Vitest, Testing Library

## Global Constraints

- The duplicate request and response must never contain `modelApiKey`.
- The server must copy `modelApiKey` directly between Prisma read and create operations.
- Copy only Gateway scalar configuration; do not copy logs, quota alerts, or AI Router relationships.
- Do not modify JSON files under `src/client/public/locales`.
- All mutations require workspace administrator permission.

---

### Task 1: Secure server-side duplicate mutation

**Files:**
- Modify: `src/server/trpc/routers/aiGateway.spec.ts`
- Modify: `src/server/trpc/routers/aiGateway.ts`

**Interfaces:**
- Consumes: `workspaceAdminProcedure`, `prisma.aIGateway.findFirst`, and `prisma.aIGateway.create`
- Produces: `aiGateway.duplicate({ workspaceId, gatewayId, name }): Promise<{ id: string; name: string }>`

- [ ] **Step 1: Extend the router test Prisma mock and write failing duplicate tests**

Add `createGateway` to the hoisted mocks and cover workspace isolation, exact scalar copying, safe response shape, and name validation. The core success assertion must be:

```ts
expect(mocks.createGateway).toHaveBeenCalledWith({
  data: {
    workspaceId,
    name: 'Gateway Copy',
    modelApiKey: apiKey,
    customModelBaseUrl: 'https://models.example.com/v1',
    customModelName: 'model-a',
    customModelStrategy: { price: { input: 1 } },
    customModelInputPrice: 2,
    customModelOutputPrice: 3,
  },
  select: { id: true, name: true },
});
expect(result).toEqual({ id: 'gateway_copy', name: 'Gateway Copy' });
expect(JSON.stringify(result)).not.toContain(apiKey);
```

- [ ] **Step 2: Run the focused server tests and verify RED**

Run: `pnpm --dir src/server exec vitest run trpc/routers/aiGateway.spec.ts`

Expected: duplicate tests fail because `caller.duplicate` and the Prisma create mock wiring do not exist.

- [ ] **Step 3: Implement the minimal duplicate mutation**

Add dedicated schemas and a router member equivalent to:

```ts
const aiGatewayDuplicateOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
});

duplicate: workspaceAdminProcedure
  .input(z.object({
    gatewayId: z.string(),
    name: z.string().trim().min(1).max(100),
  }))
  .output(aiGatewayDuplicateOutputSchema)
  .mutation(async ({ input }) => {
    const source = await prisma.aIGateway.findFirst({
      where: { id: input.gatewayId, workspaceId: input.workspaceId },
      select: {
        modelApiKey: true,
        customModelBaseUrl: true,
        customModelName: true,
        customModelStrategy: true,
        customModelInputPrice: true,
        customModelOutputPrice: true,
      },
    });
    if (!source) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'AI Gateway not found' });
    }
    return prisma.aIGateway.create({
      data: { workspaceId: input.workspaceId, name: input.name, ...source },
      select: { id: true, name: true },
    });
  }),
```

- [ ] **Step 4: Run the focused server tests and verify GREEN**

Run: `pnpm --dir src/server exec vitest run trpc/routers/aiGateway.spec.ts`

Expected: all tests in the file pass and no output contains the test token.

- [ ] **Step 5: Commit the server behavior**

```bash
git add src/server/trpc/routers/aiGateway.ts src/server/trpc/routers/aiGateway.spec.ts
git diff --cached --check
git commit -m "feat(ai-gateway): add secure duplicate mutation"
```

### Task 2: Administrator duplicate dialog and navigation

**Files:**
- Create: `src/client/components/aiGateway/AIGatewayDuplicateDialog.tsx`
- Create: `src/client/components/aiGateway/AIGatewayDuplicateDialog.component.spec.tsx`
- Modify: `src/client/routes/aiGateway/$gatewayId/index.tsx`

**Interfaces:**
- Consumes: `trpc.aiGateway.duplicate`, current `workspaceId`, `gatewayId`, and Gateway name
- Produces: `AIGatewayDuplicateDialog({ gatewayId, gatewayName })` and an administrator-only icon trigger

- [ ] **Step 1: Write failing component tests**

Test that opening shows `${gatewayName} - Copy`, submitting trims the name and sends exactly:

```ts
{
  workspaceId: 'workspace_1',
  gatewayId: 'gateway_1',
  name: 'Gateway Copy',
}
```

Also test that success refetches `aiGateway.all`, navigates to `/aiGateway/$gatewayId` using the returned ID, empty input cannot submit, pending state disables controls, and rejection preserves the dialog value.

- [ ] **Step 2: Run the focused client test and verify RED**

Run: `pnpm --dir src/client exec vitest run --config vitest.component.config.ts components/aiGateway/AIGatewayDuplicateDialog.component.spec.tsx`

Expected: test collection fails because `AIGatewayDuplicateDialog.tsx` does not exist.

- [ ] **Step 3: Implement the dialog component**

Use the existing `Dialog`, `Input`, `Label`, and `Button` components. Keep state local, call `defaultErrorHandler` through mutation options, and prevent `onOpenChange` from closing while pending. The mutation payload must be constructed only from workspace ID, source ID, and trimmed name.

- [ ] **Step 4: Wire the action into the detail header**

Render `<AIGatewayDuplicateDialog gatewayId={gatewayId} gatewayName={gateway.name} />` inside the existing `hasAdminPermission` fragment before the edit action. The dialog owns a `LuCopy` icon trigger with an accessible `title`.

- [ ] **Step 5: Run the focused client test and verify GREEN**

Run: `pnpm --dir src/client exec vitest run --config vitest.component.config.ts components/aiGateway/AIGatewayDuplicateDialog.component.spec.tsx`

Expected: all duplicate dialog tests pass.

- [ ] **Step 6: Commit the client behavior**

```bash
git add src/client/components/aiGateway/AIGatewayDuplicateDialog.tsx src/client/components/aiGateway/AIGatewayDuplicateDialog.component.spec.tsx 'src/client/routes/aiGateway/$gatewayId/index.tsx'
git diff --cached --check
git commit -m "feat(ai-gateway): add duplicate action"
```

### Task 3: Full verification

**Files:**
- Verify only; no planned modifications

**Interfaces:**
- Consumes: the server mutation and client duplicate dialog from Tasks 1 and 2
- Produces: fresh evidence that focused behavior, types, and production build pass

- [ ] **Step 1: Run both focused suites together**

```bash
pnpm --dir src/server exec vitest run trpc/routers/aiGateway.spec.ts
pnpm --dir src/client exec vitest run --config vitest.component.config.ts components/aiGateway/AIGatewayDuplicateDialog.component.spec.tsx
```

Expected: both commands exit 0 with zero failed tests.

- [ ] **Step 2: Run type checking**

Run: `pnpm check:type`

Expected: exit 0.

- [ ] **Step 3: Run the production build**

Run: `pnpm build`

Expected: exit 0.

- [ ] **Step 4: Audit final scope and secret handling**

```bash
git status --short
git diff master...HEAD --check
git diff master...HEAD --name-only
rg -n "modelApiKey" src/client/components/aiGateway/AIGatewayDuplicateDialog.tsx 'src/client/routes/aiGateway/$gatewayId/index.tsx'
```

Expected: only intentional files and commits are present; the final `rg` command has no matches.
