# Contributor Guide

## Development Tips
- Install Node.js 22.14.0+ and pnpm 10.17.1.
- Run `pnpm install` in the repo root to bootstrap all workspace packages.
- Use `pnpm dev` to start the server and client concurrently for local development.
- Run `pnpm build` to generate production assets.

## Translation Files
When generating code, **do not modify** any JSON files in `src/client/public/locales`. These translations are managed separately.

## Testing Instructions
- CI configuration is under `.github/workflows`.
- Run `pnpm check:type` and `pnpm build` to mirror CI checks.
- Execute `pnpm test` to run Vitest across packages (or `pnpm -r test` for individual packages).
- Focus on one test with `pnpm vitest run -t "<test name>"`.

## PR instructions
- Title your PR using Angular commit style, e.g. `feat: add new feature`.
