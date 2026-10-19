# Gemini Native Gateway Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for the coupled server changes and superpowers:requesting-code-review for an independent final review. Keep changes uncommitted.

**Goal:** Add Gemini native relay support to custom AI gateways using Google's SDK.

**Architecture:** One Express handler invokes `GoogleGenAI.models` with the saved relay URL and resolved key. Reuse gateway authentication, logging, custom pricing and SSE helpers; do not translate protocols or execute tools.

**Tech Stack:** TypeScript, Express 4, `@google/genai@2.22.0`, Prisma, existing Vitest/Supertest and React testing tools.

**Spec:** `docs/prd/gemini-cli-compatibility.md`

## Global Constraints

- Server-only SDK dependency; no DB migration, locale JSON edits, protocol framework, retries, or server-side tools.
- English source copy through `t()`; English tests and Spanish localized fixtures.
- Preserve native content, tool IDs, signatures, candidates, terminal metadata and count inputs.
- Saved URL/key/version and timeout settings cannot be overridden by callers.
- `v1` and `v1beta`; generation, streaming and count only; SSE idle timeout 120 seconds.
- Local mocked upstream evidence is not live CLI/relay compatibility proof.

### Task 1: Shared authentication and routing safety

Files: `src/server/model/{aiGateway,user}.ts`, `src/server/app.ts`, corresponding tests.

- [x] Add failing resolver tests for missing/wrong-workspace gateway, missing/invalid/expired key and workspace membership; exercise sibling entry points.
- [x] Run `pnpm --filter @tianji/server exec vitest run model/aiGateway.spec.ts model/aiGateway/auth.spec.ts` and observe failures.
- [x] Require a gateway and key in `resolveAIGatewayModelApiKey`; reuse `getWorkspaceUser`; replace model-list duplicated authentication with the resolver; remove key prefixes from verifier errors.
- [x] Add final JSON API 404 before SPA, make non-HTML fallback finish, preserve HTML GET behavior; test HTTP boundaries.
- [x] Re-run focused tests and check the diff.

### Task 2: Official SDK native handler and lifecycle

Files: `src/server/model/aiGateway/gemini.ts`, `gemini.spec.ts`, `src/server/router/aiGateway.ts`, server package and lock, quota alert helper.

- [x] Lock server dependency with `pnpm --filter @tianji/server add --save-exact @google/genai@2.22.0`.
- [x] Write failing HTTP tests using real SDK and a loopback upstream; assert actual URL/body, both versions, slash aliases, fixed model, signatures and count exclusivity.
- [x] Implement minimal REST-to-SDK config arrangement, using verified `extraBody` only where required to preserve native fields.
- [x] Add failing tests for malformed paths/config, credential conflict, status propagation, malformed/truncated SSE, idle timeout and cancellation; implement bounded abortable iteration and SDK-readable stream errors.
- [x] Finalize one tracked log per request, preserve raw usage, bill prompt cache once and thoughts once, mark missing usage as unknown; include paid Failed logs in quota totals.
- [x] Run `pnpm --filter @tianji/server exec vitest run model/aiGateway` and fix regressions.

### Task 3: Existing example UI

Files: `src/client/components/aiGateway/AIGatewayCodeExampleBtn{.tsx,.component.spec.tsx}`.

- [x] Add failing component assertions for Gemini CLI/API selections, actual `/custom` root, configured model and warning text.
- [x] Add CLI environment/curl examples using the existing selector and copy component; describe native upstream requirement and OpenAI-only connection test.
- [x] Run `pnpm --filter @tianji/client exec vitest run --config vitest.component.config.ts components/aiGateway/AIGatewayCodeExampleBtn.component.spec.tsx`.

### Task 4: Verification and review

- [x] Run focused tests, `pnpm check:type`, `pnpm build` and workspace tests; distinguish baseline/environment failures from introduced failures.
- [x] Dispatch an independent read-only code review of the working diff against the PRD, fix findings with regression tests, and repeat review until no actionable findings remain.
- [x] Record exact SDK/test evidence and remaining live checks in PRD. With user-provided relay configuration, run CLI 0.59.0/current stable conversation, streaming and temporary-file tool roundtrip; otherwise explicitly report this evidence as unavailable.
- [x] Inspect `git diff --check` and `git status`; leave all changes local and uncommitted.
