# LLM Generated Data CI Validation

## Goal

Add one deterministic CI check for the JSON files produced by `pnpm build:llm`.
The check runs for commits pushed to `master` and rejects malformed or structurally
invalid committed data before the normal type-check and build steps continue.

## Scope

- Validate `src/server/utils/model_prices_and_context_window.json`.
- Validate `src/server/utils/model_prices_and_context_window_v2.json`.
- Add a root `check:llm` package script.
- Invoke `pnpm check:llm` from the existing `master` push CI workflow.

The check must not fetch either upstream source. Re-fetching in CI would make the
result depend on data that can change after a developer generated the committed
files.

## Validation Rules

The validator will:

1. Parse both files as JSON and require canonical two-space JSON formatting with a
   trailing newline, matching `fs.writeJSON(..., { spaces: 2 })`.
2. Require each document to be a non-empty top-level object.
3. For the LiteLLM document, require every top-level value to be an object. The
   validator will not require pricing on every entry because the upstream document
   contains metadata and externally managed models without token pricing.
4. For the models.dev document, apply the same provider, model, cost, and limit
   structure currently enforced by `fetch-llm-model-v2.ts`.
5. Exit non-zero with the affected filename and validation error when a rule fails.

## Structure

The schema and validation functions will live in a side-effect-free module so tests
can pass in small fixtures without reading or rewriting repository data. A thin CLI
entry point will read the two committed files and report success or failure.

The existing fetch script will reuse the exported v2 schema, avoiding two schema
definitions that could drift apart.

## Testing

Focused tests will cover valid data, malformed top-level structures, invalid v2
provider/model structures, and non-canonical formatting. Tests will be written and
observed failing before the validator is implemented.

Final verification will run the focused validator tests, `pnpm check:llm`, the
server type-check, and `git diff --check`.

## Non-goals

- Re-downloading upstream data in CI.
- Requiring every LiteLLM entry to contain token pricing.
- Repairing the existing broad LiteLLM pricing test.
- Changing the CI trigger from `master` push.
