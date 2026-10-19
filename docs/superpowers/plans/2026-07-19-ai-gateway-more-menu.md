# AI Gateway More Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Code Example directly visible while grouping the administrator-only Edit, Duplicate, and Delete actions into one accessible More menu on the AI Gateway detail page.

**Architecture:** Convert `AIGatewayDuplicateDialog` into a controlled dialog, then add a focused `AIGatewayActionsMenu` that owns dropdown and duplicate-dialog state. The detail route keeps permission gating, navigation, and deletion side effects and passes callbacks into the menu.

**Tech Stack:** React 18, TypeScript, TanStack Router, Radix dropdown/dialog components, React Icons, Vitest, Testing Library.

## Global Constraints

- Code Example remains directly visible and is not moved into the menu.
- The More menu and all three actions remain administrator-only.
- Menu order is Edit, Duplicate, Delete; Delete retains confirmation and destructive styling.
- Existing duplicate and delete server contracts do not change.
- Do not modify JSON files under `src/client/public/locales`.
- Follow TDD: add each behavior test and observe the expected failure before production edits.

---

### Task 1: Make the duplicate dialog controllable by an actions menu

**Files:**
- Modify: `src/client/components/aiGateway/AIGatewayDuplicateDialog.tsx`
- Test: `src/client/components/aiGateway/AIGatewayDuplicateDialog.component.spec.tsx`

**Interfaces:**
- Consumes: `gatewayId: string`, `gatewayName: string`, `open: boolean`, and `onOpenChange: (open: boolean) => void`.
- Produces: a triggerless controlled `AIGatewayDuplicateDialog` whose mutation payload and success behavior are unchanged.

- [ ] **Step 1: Change the component tests to drive the controlled interface**

Add a small stateful harness and replace clicks on the old standalone Duplicate trigger with the harness trigger:

```tsx
function DuplicateDialogHarness(props: {
  gatewayId?: string;
  gatewayName?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open duplicate dialog</button>
      <AIGatewayDuplicateDialog
        gatewayId={props.gatewayId ?? 'gateway_1'}
        gatewayName={props.gatewayName ?? 'Primary Gateway'}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
```

Update each render to use `DuplicateDialogHarness`, click `Open duplicate dialog`, and keep the existing assertions for bounded default name, safe payload, pending behavior, retry state, refresh, and navigation. Add an assertion that the dialog itself no longer renders a second standalone button named `Duplicate` while closed.

- [ ] **Step 2: Run the focused dialog test and verify RED**

Run:

```bash
pnpm --dir src/client test --run --config vitest.component.config.ts components/aiGateway/AIGatewayDuplicateDialog.component.spec.tsx
```

Expected: FAIL because `AIGatewayDuplicateDialog` does not accept `open` or `onOpenChange` and still owns a `DialogTrigger`.

- [ ] **Step 3: Implement the controlled duplicate dialog**

Change the props and dialog shell to this interface:

```tsx
interface AIGatewayDuplicateDialogProps {
  gatewayId: string;
  gatewayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIGatewayDuplicateDialog({
  gatewayId,
  gatewayName,
  open,
  onOpenChange,
}: AIGatewayDuplicateDialogProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(open ? buildDuplicateName(gatewayName) : '');
  }, [gatewayName, open]);

  const handleOpenChange = useEvent((nextOpen: boolean) => {
    if (duplicateMutation.isPending) {
      return;
    }
    onOpenChange(nextOpen);
  });
}
```

Remove `DialogTrigger`, the standalone icon button, and the now-unused `LuCopy` import. Keep the existing `<Dialog open={open} onOpenChange={handleOpenChange}>` content. In the success path, replace the internal close/reset calls:

```tsx
onOpenChange(false);
```

Retain the existing safe mutation input, list refetch, and navigation. Do not call `onOpenChange(false)` in the catch path so the entered name remains available for retry.

- [ ] **Step 4: Run the focused dialog test and verify GREEN**

Run the command from Step 2.

Expected: all `AIGatewayDuplicateDialog` component tests PASS with no warnings.

- [ ] **Step 5: Commit the controlled-dialog change**

```bash
git add src/client/components/aiGateway/AIGatewayDuplicateDialog.tsx src/client/components/aiGateway/AIGatewayDuplicateDialog.component.spec.tsx
git diff --cached --check
git commit -m "refactor(ai-gateway): control duplicate dialog"
```

---

### Task 2: Add the AI Gateway More menu and wire the detail route

**Files:**
- Create: `src/client/components/aiGateway/AIGatewayActionsMenu.tsx`
- Create: `src/client/components/aiGateway/AIGatewayActionsMenu.component.spec.tsx`
- Modify: `src/client/routes/aiGateway/$gatewayId/index.tsx`
- Modify: `src/client/components/aiGateway/AIGatewayDetailRoute.component.spec.tsx`

**Interfaces:**
- Consumes: controlled `AIGatewayDuplicateDialog` from Task 1 and callbacks supplied by the detail route.
- Produces: `AIGatewayActionsMenu({ gatewayId, gatewayName, onEdit, onDelete })`.

- [ ] **Step 1: Write failing actions-menu component tests**

Create tests that render:

```tsx
<AIGatewayActionsMenu
  gatewayId="gateway_1"
  gatewayName="Primary Gateway"
  onEdit={mocks.onEdit}
  onDelete={mocks.onDelete}
/>
```

Verify the trigger is `getByRole('button', { name: 'More' })`; after opening it, verify Edit, Duplicate, and Delete appear in DOM order. Click Edit and expect `onEdit` once. Click Duplicate and expect a mocked controlled `AIGatewayDuplicateDialog` to receive `open: true`. For Delete, make the `AlertConfirm` mock expose a `Confirm delete` button and verify `onDelete` is untouched on menu selection and called only after confirmation.

- [ ] **Step 2: Run the actions-menu test and verify RED**

Run:

```bash
pnpm --dir src/client test --run --config vitest.component.config.ts components/aiGateway/AIGatewayActionsMenu.component.spec.tsx
```

Expected: FAIL because `AIGatewayActionsMenu.tsx` does not exist.

- [ ] **Step 3: Implement the focused actions-menu component**

Create the component with this public contract and structure:

```tsx
interface AIGatewayActionsMenuProps {
  gatewayId: string;
  gatewayName: string;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function AIGatewayActionsMenu(props: AIGatewayActionsMenuProps) {
  const { t } = useTranslation();
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>
          <Button
            variant="outline"
            size="icon"
            Icon={LuEllipsisVertical}
            aria-label={t('More')}
            title={t('More')}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={props.onEdit}>
            <LuPencil className="mr-2" />
            {t('Edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDuplicateOpen(true)}>
            <LuCopy className="mr-2" />
            {t('Duplicate')}
          </DropdownMenuItem>
          <AlertConfirm
            title={`${t('Delete AI Gateway')} ${props.gatewayName}`}
            description={t(
              'Are you sure you want to delete this AI Gateway? This action cannot be undone.'
            )}
            onConfirm={props.onDelete}
          >
            <DropdownMenuItem
              onSelect={(event) => event.preventDefault()}
              className="text-red-600 data-[highlighted]:!bg-red-50 data-[highlighted]:!text-red-700"
            >
              <LuTrash className="mr-2" />
              {t('Delete')}
            </DropdownMenuItem>
          </AlertConfirm>
        </DropdownMenuContent>
      </DropdownMenu>
      <AIGatewayDuplicateDialog
        gatewayId={props.gatewayId}
        gatewayName={props.gatewayName}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
      />
    </>
  );
}
```

- [ ] **Step 4: Run the actions-menu test and verify GREEN**

Run the command from Step 2.

Expected: all actions-menu tests PASS and confirm menu order, duplicate state, edit callback, and delete confirmation.

- [ ] **Step 5: Write the failing detail-route integration tests**

Replace the duplicate-dialog mock with an `AIGatewayActionsMenu` mock carrying `aria-label="AI Gateway actions"`. Update the two existing tests to assert:

```tsx
expect(screen.getByText('Code example')).toBeInTheDocument();
expect(screen.getByLabelText('AI Gateway actions')).toBeInTheDocument();
```

for administrators, and:

```tsx
expect(screen.getByText('Code example')).toBeInTheDocument();
expect(screen.queryByLabelText('AI Gateway actions')).not.toBeInTheDocument();
```

for non-administrators. Capture the menu props and assert that invoking `onEdit` navigates to `/aiGateway/$gatewayId/edit` with the current ID and that `onDelete` retains the existing mutation, refetch, and list navigation sequence.

- [ ] **Step 6: Run the detail-route test and verify RED**

Run:

```bash
pnpm --dir src/client test --run --config vitest.component.config.ts components/aiGateway/AIGatewayDetailRoute.component.spec.tsx
```

Expected: FAIL because the route still imports and renders three standalone administrator actions rather than `AIGatewayActionsMenu`.

- [ ] **Step 7: Replace standalone route actions with the menu**

Import `AIGatewayActionsMenu`, remove direct imports of `AIGatewayDuplicateDialog`, `AlertConfirm`, `LuPencil`, and `LuTrash`, and define an edit callback:

```tsx
const handleEditGateway = useEvent(() => {
  navigate({
    to: '/aiGateway/$gatewayId/edit',
    params: { gatewayId },
  });
});
```

Keep Code Example outside the permission gate, then render only:

```tsx
{hasAdminPermission && (
  <AIGatewayActionsMenu
    gatewayId={gatewayId}
    gatewayName={gateway.name}
    onEdit={handleEditGateway}
    onDelete={handleDeleteGateway}
  />
)}
```

- [ ] **Step 8: Run both menu and route tests and verify GREEN**

Run:

```bash
pnpm --dir src/client test --run --config vitest.component.config.ts \
  components/aiGateway/AIGatewayActionsMenu.component.spec.tsx \
  components/aiGateway/AIGatewayDetailRoute.component.spec.tsx \
  components/aiGateway/AIGatewayDuplicateDialog.component.spec.tsx
```

Expected: all focused AI Gateway component tests PASS.

- [ ] **Step 9: Commit the More-menu integration**

```bash
git add \
  src/client/components/aiGateway/AIGatewayActionsMenu.tsx \
  src/client/components/aiGateway/AIGatewayActionsMenu.component.spec.tsx \
  src/client/components/aiGateway/AIGatewayDetailRoute.component.spec.tsx \
  'src/client/routes/aiGateway/$gatewayId/index.tsx'
git diff --cached --check
git commit -m "feat(ai-gateway): group actions under more menu"
```

---

### Task 3: Verify the completed behavior

**Files:**
- Verify only; no planned production changes.

**Interfaces:**
- Consumes: the controlled duplicate dialog, actions menu, and detail-route integration from Tasks 1-2.
- Produces: evidence that focused tests, type checking, and production build pass without locale changes.

- [ ] **Step 1: Run all AI Gateway component tests**

```bash
pnpm --dir src/client test --run --config vitest.component.config.ts components/aiGateway
```

Expected: PASS.

- [ ] **Step 2: Run type checking**

```bash
pnpm check:type
```

Expected: exit code 0.

- [ ] **Step 3: Run the production build**

```bash
pnpm build
```

Expected: exit code 0. If the known generated geo-database step is environment-sensitive, rerun with the repository's established `VERCEL=1 pnpm build` path and report both outcomes exactly.

- [ ] **Step 4: Verify scope and locale safety**

```bash
git status --short --branch --untracked-files=all
git diff --check HEAD~2..HEAD
git diff --name-only HEAD~2..HEAD -- src/client/public/locales
```

Expected: only the planned docs, AI Gateway component, test, and route files changed; the locale command prints nothing.
