# Website Sidebar 24-Hour PV Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `website.allOverview` return each website's page-view count for the previous rolling 24 hours instead of its total event count.

**Architecture:** Keep the current tRPC response and Website list rendering unchanged. Add the canonical page-view predicates to the existing Prisma aggregation and protect the behavior with a route-level database test.

**Tech Stack:** TypeScript, tRPC, Prisma, PostgreSQL, Vitest

## Global Constraints

- A page view requires `eventType = EVENT_TYPE.pageView` and `eventName = null`.
- The time window remains `createdAt >= current time - 1 day`.
- Do not deduplicate by visitor or session.
- Do not modify locale JSON files.
- Do not change the API response shape or client rendering.
- Do not commit or push unless the user explicitly requests it.

---

### Task 1: Protect the 24-hour PV aggregation

**Files:**
- Create: `src/server/trpc/routers/website.spec.ts`
- Modify: `src/server/trpc/routers/website.ts:1-20,147-158`

**Interfaces:**
- Consumes: `websiteRouter.createCaller(context)` and the existing `allOverview({ workspaceId })` procedure.
- Produces: the unchanged `Record<string, number>` result, with values limited to canonical page views in the rolling 24-hour window.

- [ ] **Step 1: Write the failing integration test**

Create a real workspace, website, session, recent page view, recent custom event, and page view older than 24 hours. Call the real tRPC procedure and assert that only the recent page view is counted:

```ts
import { createId } from '@paralleldrive/cuid2';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { prisma } from '../../model/_client.js';
import { createTestContext } from '../../tests/utils.js';
import { EVENT_TYPE } from '../../utils/const.js';

const mocks = vi.hoisted(() => {
  const endRequest = vi.fn();

  return {
    endRequest,
    jwtVerify: vi.fn(() => ({
      id: 'user-id',
      username: 'user',
      role: 'user',
    })),
    getWorkspaceUser: vi.fn(async () => ({ role: 'owner' })),
    promStartTimer: vi.fn(() => endRequest),
  };
});

vi.mock('../../middleware/auth.js', () => ({ jwtVerify: mocks.jwtVerify }));
vi.mock('../../model/auth.js', () => ({ authConfig: {} }));
vi.mock('../../model/user.js', () => ({ verifyUserApiKey: vi.fn() }));
vi.mock('../../model/workspace.js', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
}));
vi.mock('../../utils/prometheus/client.js', () => ({
  promTrpcRequest: { startTimer: mocks.promStartTimer },
}));

async function createCaller() {
  const { websiteRouter } = await import('./website.js');
  return websiteRouter.createCaller({
    token: 'jwt-token',
    timezone: 'utc',
    language: 'en',
    req: {} as any,
    origin: '',
  });
}

const { createTestWorkspace } = createTestContext();

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.resetModules());

describe('websiteRouter.allOverview', () => {
  test('counts only page views from the previous 24 hours', async () => {
    const workspace = await createTestWorkspace();
    const website = await prisma.website.create({
      data: {
        name: 'PV Test Website',
        domain: 'example.com',
        workspaceId: workspace.id,
      },
    });
    const session = await prisma.websiteSession.create({
      data: {
        id: randomUUID(),
        websiteId: website.id,
        hostname: 'example.com',
      },
    });
    const now = Date.now();

    await prisma.websiteEvent.createMany({
      data: [
        {
          id: createId(),
          websiteId: website.id,
          sessionId: session.id,
          urlPath: '/recent-page',
          eventType: EVENT_TYPE.pageView,
          eventName: null,
          createdAt: new Date(now - 60 * 60 * 1000),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: session.id,
          urlPath: '/recent-custom',
          eventType: EVENT_TYPE.customEvent,
          eventName: 'click',
          createdAt: new Date(now - 60 * 60 * 1000),
        },
        {
          id: createId(),
          websiteId: website.id,
          sessionId: session.id,
          urlPath: '/old-page',
          eventType: EVENT_TYPE.pageView,
          eventName: null,
          createdAt: new Date(now - 25 * 60 * 60 * 1000),
        },
      ],
    });

    const caller = await createCaller();
    const result = await caller.allOverview({ workspaceId: workspace.id });

    expect(result).toEqual({ [website.id]: 1 });
  });
});
```

The production mutation caught by this test is removing either PV predicate, which would make the recent custom event inflate the result from `1` to `2`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm vitest run src/server/trpc/routers/website.spec.ts
```

Expected: FAIL because `allOverview` currently counts both recent event rows and returns `2`.

- [ ] **Step 3: Add the canonical PV predicates**

Import `EVENT_TYPE` from `../../utils/const.js`, then extend the existing Prisma `where` clause:

```ts
where: {
  websiteId: {
    in: [...websiteIds],
  },
  eventType: EVENT_TYPE.pageView,
  eventName: null,
  createdAt: {
    gte: dayjs().subtract(1, 'day').toDate(),
  },
},
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
pnpm vitest run src/server/trpc/routers/website.spec.ts
```

Expected: PASS with one passing test and no warnings.

- [ ] **Step 5: Run repository verification**

Run:

```bash
pnpm check:type
```

Expected: exit code `0`.

Then run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the approved design, plan, test, and router files are changed.
