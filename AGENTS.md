# Contributor Guide

## Language

- English is the primary language for all repository content, including documentation, PRDs, plans, code comments, examples, UI source strings, and commit/PR text.
- Write new and updated content in English regardless of the language used in the request, unless another language is explicitly required. Follow the translation and localized-test-fixture rules below for localization.

## Development Tips
- Install Node.js 22.14.0+ and pnpm 9.7.1.
- Run `pnpm install` in the repo root to bootstrap all workspace packages.
- Use `pnpm dev` to start the server and client concurrently for local development.
- Run `pnpm build` to generate production assets.
- Prefer reusing existing hooks, components, utilities, and other project assets instead of creating new implementations.

## Serialization Boundaries
- Treat all tRPC HTTP inputs as JSON wire values; objects such as `Date` arrive in their serialized form unless a transformer is explicitly configured.
- For date inputs, use `z.coerce.date<Date>()` at the server boundary, or validate an ISO date string and convert it before use.
- Cover the serialized wire value in route tests. Do not test date inputs only by passing a native `Date` directly to a caller.

## Translation Files
All user-facing copy must be written in English and wrapped with the project's `t()` translation function. Do not add Chinese copy directly in source code.

Do not use `{{count}}` as a translation interpolation variable. Use `{{num}}` or another descriptive name, with a matching key in `t()` options, for example: `t('{{num}} items', { num: total })`.

When generating code, **do not modify** any JSON files in `src/client/public/locales`. These translations are managed separately.

## Audit Logs
- Record every successful authenticated persistent create, update, and delete operation, plus permission and API key changes, in the workspace audit log.
- Prefer the shared audited workspace mutation procedures. If an endpoint bypasses them, write the audit log explicitly after success. Include the actor, action, target, and redacted changed fields; never persist secrets.

## Testing Instructions
- CI configuration is under `.github/workflows`.
- Run `pnpm check:type` and `pnpm build` to mirror CI checks.
- Execute `pnpm test` to run Vitest across packages (or `pnpm -r test` for individual packages).
- Focus on one test with `pnpm vitest run -t "<test name>"`.
- Do not use Chinese text in test cases; use Spanish for localized test fixtures and assertions.

## PR instructions
- Title your PR using Angular commit style, e.g. `feat: add new feature`.
