# Contributor Guide

## Development Tips
- Install Node.js 22.14.0+ and pnpm 9.7.1.
- Run `pnpm install` in the repo root to bootstrap all workspace packages.
- Use `pnpm dev` to start the server and client concurrently for local development.
- Run `pnpm build` to generate production assets.
- Prefer reusing existing hooks, components, utilities, and other project assets instead of creating new implementations.

## Translation Files
When generating code, **do not modify** any JSON files in `src/client/public/locales`. These translations are managed separately.

## Audit Logs
- Record every successful authenticated persistent create, update, and delete operation, plus permission and API key changes, in the workspace audit log.
- Prefer the shared audited workspace mutation procedures. If an endpoint bypasses them, write the audit log explicitly after success. Include the actor, action, target, and redacted changed fields; never persist secrets.

## Testing Instructions
- CI configuration is under `.github/workflows`.
- Run `pnpm check:type` and `pnpm build` to mirror CI checks.
- Execute `pnpm test` to run Vitest across packages (or `pnpm -r test` for individual packages).
- Focus on one test with `pnpm vitest run -t "<test name>"`.

## PR instructions
- Title your PR using Angular commit style, e.g. `feat: add new feature`.
