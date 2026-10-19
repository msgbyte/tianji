# Responses WebSocket Custom and AI Router Implementation Plan

> **For Codex:** Execute this plan inline with test-driven development and verify before completion.

**Goal:** Extend Responses WebSocket proxying to custom gateways and AI Router routes.

**Architecture:** Reuse the existing gateway authentication, router node ordering, model override, logging, and pricing helpers. Select and connect an AI Router node during the WebSocket handshake, then pin that upstream connection for the session; only handshake failures may advance to another node.

**Tech Stack:** TypeScript, `ws`, Vitest, Prisma

---

### Task 1: Define route and forwarding behavior with failing tests

**Files:**
- Modify: `src/server/ws/index.spec.ts`

1. Add parser coverage for gateway `custom` and AI Router `openai`/`custom` routes.
2. Add an integration test proving custom base URL and model override forwarding.
3. Add an integration test proving Router handshake fallback and connection pinning.
4. Run the focused test and confirm the new cases fail.

### Task 2: Implement custom Gateway WebSocket support

**Files:**
- Modify: `src/server/ws/index.ts`
- Modify: `src/server/model/aiGateway.ts`

1. Generalize route parsing for the custom provider.
2. Convert custom HTTP(S) base URLs to WS(S) Responses URLs.
3. Apply the configured custom model name to `response.create` events.
4. Reuse custom pricing when completing Gateway logs.
5. Run the focused tests.

### Task 3: Implement AI Router WebSocket support

**Files:**
- Modify: `src/server/model/aiRouter.ts`
- Modify: `src/server/ws/index.ts`

1. Expose the existing eligible-node ordering for WebSocket handshakes.
2. Verify the client API key once, connect candidates in tier/weight order, and retry only failed handshakes.
3. Pin the successful upstream for the downstream session.
4. Write Gateway and Router logs for each `response.create` lifecycle.
5. Run focused tests.

### Task 4: Verify the completed change

1. Run focused WebSocket, Gateway, and Router tests.
2. Run `pnpm check:type` and `pnpm build`.
3. Run formatting/diff checks and inspect the final diff for unrelated changes.
