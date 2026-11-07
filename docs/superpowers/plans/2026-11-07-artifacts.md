# Workspace Artifacts implementation plan

**Goal:** Publish workspace-private HTML through an API and an installable agent Skill, and inspect it in the dashboard.

**Architecture:** Store current content in Prisma, expose workspace-authorized tRPC/OpenAPI procedures, and render HTML in an opaque-origin iframe with a viewer-owned CSP.

**Stack:** PostgreSQL, Prisma, tRPC, Zod, React, TanStack Router, Vitest, Playwright, existing tar packaging.

**Spec:** [Approved design](../specs/2026-11-07-artifacts-design.md)

## Global constraints

- Reuse existing authentication, permissions, audit helpers, layouts and controls; add no dependencies.
- English source strings through `t()`; leave locale JSON untouched.
- Limit source to 1 MiB UTF-8; use atomic revision matching and redact HTML in audit logs.
- Keep HTML out of the dashboard DOM. No same-origin sandbox permission or privileged bridge.
- Work directly on the repository's primary branch, `master`, as requested by the user; stage the completed work as small, independently verified commits under the subsequent user authorization; no pushes, deployments or shared database migrations.

## Review focus

Check authorization on every route, workspace ID scoping, update races, metadata-only listing, source redaction, untrusted HTML isolation, workspace-switch lifecycle, and Skill credential handling. Check API examples against the actual OpenAPI contract. Treat mocked database tests separately from real PostgreSQL evidence.

## Task 1: Persistence and API

**Files:** Prisma schema/migration/generated models; `trpc/routers/artifact.ts` and its tests; router registry; audit path configuration.

**Interface:** `artifact.list/get/create/update/delete`, REST `/workspace/{workspaceId}/artifacts`, metadata with `revision` and relative `path`; detail adds `source`.

- [x] Add API tests for JSON requests, membership/roles, cross-workspace access, validation, pagination, revision conflicts and audit redaction; observe failure before implementation.
- [x] Add the Artifact model and additive SQL migration, generate Prisma, implement procedures and register them.
- [x] Run focused server tests. Expected: all assertions pass, including exactly one winning revision update.

## Task 2: Dashboard and preview

**Files:** artifact components/tests; `/artifacts` routes; desktop/mobile navigation; generated route tree.

**Interface:** Consume Task 1 metadata/detail. Deep links include `workspaceId`; mismatch disables detail queries. Source tab and workspace changes unmount the iframe.

- [x] Add failing preview lifecycle/isolation tests.
- [x] Add list/search/load-more, empty/error/loading states, detail/source/preview/actions and install instructions using existing controls.
- [x] Run component tests and disposable Chromium isolation checks. Expected: interactive HTML runs while parent access, storage, fetch, forms, popups and top navigation fail.

## Task 3: Skill, distribution and final verification

**Files:** `skills/tianji-artifacts`; website packaging script/test/archive/docs/hooks; website workflow.

**Interface:** `TIANJI_SERVER_URL`, `TIANJI_WORKSPACE_ID`, `TIANJI_API_KEY`; API schemas and preview constraints from Tasks 1–2.

- [x] Add a failing archive extraction test, then package the Skill and write matching installation/API guidance.
- [x] Verify archive contents and documented operations against the test API. Expected: source-equivalent archive, safe JSON upload, no credentials.
- [x] Run focused tests, `pnpm check:type`, `pnpm build`, and English website build using Node.js 22 or newer. Expected: successful exits; document any verified baseline/environment blockers.
- [x] Request one fresh final review, resolve important findings with regression coverage, and record actual delivery limits.
