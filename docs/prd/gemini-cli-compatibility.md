# Tianji AI Gateway: Native Gemini Relay and CLI Integration PRD

Date: 2026-09-14. Status: local implementation and automated verification complete; CLI acceptance testing against a real relay remains pending (see Section 12).

Initial scope: use Google's official `@google/genai` SDK in the existing custom AI Gateway to call a relay's native Gemini API. No OpenAI protocol conversion.

## 1. Problem Statement

The user's relay provides a native Gemini API (`/v1beta/models/...`), which they want to access through Tianji using the official Gemini CLI or SDK. Previously, OpenAI streaming requests through the same gateway returned successfully, but Gemini CLI remained stuck on `Thinking…` after sending a request.

Earlier investigation findings (production requests were not repeated during this documentation revision):

- The local Gemini CLI version was `0.59.0`, using API key authentication and a custom base URL.
- A production request to `/custom/v1/chat/completions` returned HTTP 200 and SSE data. The native Gemini streaming path on the same gateway returned no bytes within a 20-second test window.
- The local Tianji routes included OpenAI and Anthropic endpoints, but did not register Gemini's `generateContent` or `streamGenerateContent` endpoints.
- The SPA fallback in the local `app.ts` only handled GET requests accepting HTML. Unmatched POST requests neither ended the response nor continued to another handler, leaving connections hanging.

The deployed version has not been fully compared with the local source. The findings above distinguish observed production behavior from local source-code issues.

`/v1` is only a version path. Gemini's `/v1/models/...:generateContent` and OpenAI's `/v1/chat/completions` use different protocols; changing the base URL suffix does not make them compatible.

## 2. Goals and User Flow

Users should be able to complete text conversations, receive streaming output, and execute local tool-call round trips in Gemini CLI through the existing custom gateway, while retaining Tianji's key resolution, model overrides, logs, usage tracking, and pricing. Native Gemini relay support is the primary feature; the CLI is the main acceptance client.

Expected workflow:

1. Configure the Gemini upstream base URL, upstream key, and optional fixed model on an existing custom gateway in Tianji. See Section 4 for URL requirements.
2. Select `Gemini CLI` in the code examples and copy the environment variables into a terminal.
3. Start the official Gemini CLI and select `Use Gemini API Key` for authentication.
4. Chat, read project files, and continue answering based on tool results. Return to the input prompt after cancellation or an error.

Configuration example:

```bash
export GOOGLE_GEMINI_BASE_URL="https://your-tianji.example/api/ai/<workspaceId>/<gatewayId>/custom"
export GEMINI_API_KEY="<gateway-access-key>"
export GEMINI_MODEL="<upstream-model-id>"
gemini
```

Keep `/custom` in the CLI base URL and do not append a version path. This differs from the saved upstream URL, which may include `/v1` or `/v1beta` (see Section 4). The SDK's default API version is used for requests to Tianji unless overridden. To send v1 requests to Tianji, set `GOOGLE_GENAI_API_VERSION="v1"` before starting the CLI; a version explicitly configured in the gateway's upstream URL still takes precedence upstream. This changes the Gemini API version, not the protocol to OpenAI. See the [Gemini CLI configuration documentation](https://geminicli.com/docs/reference/configuration/#environment-variables) and [authentication documentation](https://geminicli.com/docs/get-started/authentication/) for environment variables and API key authentication.

## 3. Scope

| Capability | Initial requirements |
| --- | --- |
| Text generation | Non-streaming and streaming responses, multi-turn history, and system instructions |
| Tool calls | Declarations, arguments, result submission, sequential and parallel calls, and signature preservation |
| Gemini API versions | Accept `v1beta` and `v1`; use the saved upstream URL's explicit version, or the requested version for unversioned URLs; actual capabilities depend on the relay |
| Custom models | Preserve model aliases containing `/` and reuse the gateway's fixed-model override rules |
| Authentication and operations | Reuse existing key resolution, logging, usage, pricing, and quota-related logic |
| Failure handling | Explicit HTTP/SSE errors, timeouts, interruption handling, and prompt termination of unknown routes |
| Code examples | Gemini CLI environment variables and native Gemini curl examples |
| Token counting | Call native `countTokens` on the same relay with the same effective model; preserve the actual result or error |

The initial release excludes Gemini-to-OpenAI conversion, Gemini routes in AI Router, Google account OAuth, Vertex AI, automatic model discovery, and additional APIs such as Files, cache management, Embedding, and Live. Unsupported routes must return explicit errors.

Initial acceptance focuses on text and local tools. Do not build a separate adaptation layer for multimodal features or Google's built-in tools. Preserve native parameters within supported top-level REST request fields and let the upstream determine whether it supports them. Unsupported top-level fields must return 400. Responses are subject to the pinned SDK's field-conversion limits (see Section 7); do not claim complete or byte-for-byte passthrough.

File, terminal, and MCP tools executed locally by Gemini CLI are within the initial tool-call scope. The gateway does not execute these tools.

Compatibility claims must be limited to tested CLI versions, upstreams, and features. Use `0.59.0`, the version involved in this issue, for the first acceptance run. Also test the stable version available before release and record the results.

## 4. API Contract

Common prefix:

```text
/api/ai/:workspaceId/:gatewayId/custom
```

| Method | Relative path | Behavior |
| --- | --- | --- |
| POST | `/{version}/models/{model}:generateContent` | Gemini JSON request and Gemini JSON response |
| POST | `/{version}/models/{model}:streamGenerateContent?alt=sse` | Gemini JSON request and Gemini SSE response |
| POST | `/{version}/models/{model}:countTokens` | Native Gemini token-count request and result, or upstream error |

Only `v1` and `v1beta` are allowed. Model paths must support multi-segment aliases such as `models/relay/gemini-model:streamGenerateContent`; a `:model` parameter that matches only one segment is insufficient. Parse the version, complete model ID, and trailing action separately, then let the SDK construct the upstream request path.

Return 400 for empty models, malformed encoding, path traversal, and URL or query-parameter injection. The upstream host and base path must come only from the saved gateway configuration, never from the requested model, request body, or caller headers. Verify aliases containing `/` against the actual paths sent by the SDK, not just a parser unit test.

### Upstream URL and Version

Continue using `customModelBaseUrl`. Prefer a complete API base URL such as `https://relay.example/v1beta` or `https://relay.example/gemini/v1beta`. Accept an optional trailing slash. An explicit trailing `/v1` or `/v1beta` takes precedence over the incoming request version. Split that suffix into the SDK's `apiVersion` and pass the remaining prefix as `httpOptions.baseUrl`, preserving relay path prefixes and avoiding duplicate version paths. Do not rewrite the saved configuration or change OpenAI URL handling.

For example, with saved URL `https://relay.example/gemini/v1beta`, incoming version `v1`, and effective model `gemini-model`, the final request URL must be `https://relay.example/gemini/v1beta/models/gemini-model:generateContent`. The same resolution applies to streaming and token counting.

Existing unversioned URLs such as `https://relay.example` or `https://relay.example/gemini` remain compatible and use the validated incoming version. There is no automatic version guessing, retry, or downgrade: a configured `/v1` stays `/v1`, and an unversioned URL receiving `v1` still calls upstream `v1`, even if the relay only supports `v1beta`.

Reject non-HTTP(S) URLs, credentials, queries, fragments, malformed encoding, complete API action paths, and `/v1` or `/v1beta` segments left inside the base prefix. A missing URL must produce an explicit error, not silently fall back to Google's service.

The external format follows the [Gemini GenerateContent REST contract](https://ai.google.dev/api/generate-content). Supporting both version paths does not imply support for every Google API feature.

### Authentication and Model Selection

- Accept `x-goog-api-key` and support `Authorization: Bearer ...`. Return 400 if both are supplied with different values, and 401 if credentials are missing.
- Reuse `resolveAIGatewayModelApiKey` after extracting the key. When a server-side model key is configured, validate the caller's Tianji key and access to the target workspace before using the server-side key upstream.
- Without a server-side model key, preserve the existing bring-your-own-upstream-key behavior. This must not grant access to server-side keys belonging to other gateways. Both modes must validate that the gateway exists and belongs to the workspace in the path.
- The original helper lacked this workspace access check. It has been added to shared authentication, with regression coverage for the other endpoints.
- Continue using `customModelBaseUrl`. If `customModelName` is configured, it overrides the requested model; otherwise, use the model ID from the path.
- Apply the fixed-model override to the CLI's auxiliary model requests as well, so they do not unexpectedly use a default model unsupported by the relay.
- Initialize the SDK with the resolved upstream key; do not forward caller authentication headers. Reuse only necessary, safe forwarding headers and prevent callers from overriding SDK transport settings.
- Do not log authentication headers or include keys or key prefixes in error messages, examples, or URL query parameters. Remove the existing key-prefix disclosure from invalid-key errors.

## 5. Minimal Implementation: Thin Handler and Official SDK

Use a single request flow:

```text
Gemini CLI
  → Native Gemini request
  → Tianji validation, authentication, and model resolution
  → GoogleGenAI (@google/genai)
  → Relay's native Gemini API
  → Gemini JSON / SSE response to CLI
```

Prefer Google's official JavaScript / TypeScript SDK, [`@google/genai`](https://github.com/googleapis/js-genai), and add the dependency only to the server workspace. Do not introduce an OpenAI adapter, create `ai.chats` sessions in the gateway, or persist additional conversation state.

| Incoming action | SDK method |
| --- | --- |
| `generateContent` | `ai.models.generateContent` |
| `streamGenerateContent` | `ai.models.generateContentStream` |
| `countTokens` | `ai.models.countTokens` |

SDK parameters are not identical to the REST request body. The implementation pins `@google/genai@2.22.0`: pass the complete `contents` to the SDK and place the validated REST body in a server-constructed `config.httpOptions.extraBody`. This preserves native `generationConfig`, tool schemas, system instructions, and signatures without having SDK parameter conversion rewrite them. All three endpoints still call only the official `ai.models` methods; do not write a separate fetch transport or SSE parser.

Validate the necessary outer structure and security boundaries without duplicating the entire Google API schema. Preserve the semantics of generation parameters already supported by the SDK, leave capability validation to the upstream, and do not impose a single-candidate restriction. For required REST fields that cannot be expressed directly, first check the SDK's `httpOptions.extraBody`. Add only fields justified by actual requests or the official contract, not a speculative extension system.

Only the server may set `baseUrl`, authentication headers, API version, timeouts, retries, and `abortSignal`. Never spread caller-supplied `config` or `httpOptions` directly into SDK options. Model overrides also apply to model fields in the supplemental request body. [HttpOptions](https://googleapis.github.io/js-genai/release_docs/interfaces/types.HttpOptions.html) provides custom base URLs, additional request bodies, timeouts, and retry options.

The SDK is a native protocol client, not a byte-transparent proxy. Verify field preservation against actual outgoing HTTP requests and returned data. If a limitation in the pinned SDK blocks the CLI, first test whether public configuration options resolve it. Only if they do not, use a minimal native `fetch` workaround for the affected endpoint and document the reason. Do not maintain two implementations in advance.

## 6. Tool Calls and Signatures

This is an initial release requirement. Successful plain-text chat alone does not establish Gemini CLI compatibility.

- Preserve text, `functionCall`, `functionResponse`, IDs, arguments, results, and ordering in `contents[].parts[]`. Do not rematch or renumber same-name parallel calls or multi-turn history.
- Keep each `thoughtSignature` on its original part. Do not extract and recombine signatures, discard signature-bearing parts without text, or fabricate placeholder signatures.
- Explicitly disable SDK automatic function execution with `automaticFunctionCalling.disable`. The gateway only forwards tool declarations and results; it does not register executable functions or MCP clients. File and terminal tools remain local to the CLI.
- Do not implement OpenAI tool-call ID mappings, concatenate argument strings, or invent completion signals. Return Gemini chunks in SDK order, including native tool-call deltas and trailing metadata.

Signatures are metadata that must survive a round trip unchanged. Google's documentation states that missing required signatures in Gemini 3 tool calls can cause subsequent requests to return 4xx errors; see the [official thought signatures documentation](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures). If the target relay drops signatures, the gateway cannot repair them, and that combination must not be marked as passing tool-call acceptance.

## 7. Responses and Streaming Lifecycle

### Response Format

For non-streaming responses, serialize the Gemini response data returned by the SDK. For streaming, consume the SDK's async iterator and write each Gemini chunk as `data: <JSON>\n\n`. Do not reconstruct responses from `.text` alone or expose SDK-specific properties such as `sdkHttpResponse` or upstream headers to callers.

Known limits of the pinned SDK: it renames native `citationMetadata.citationSources` to `citations`. The gateway restores the REST field, with non-streaming and streaming coverage using the official SDK as a downstream client. SDK 2.22.0 drops `candidate.finishMessage` during response conversion, so this implementation cannot return that field; `finishReason` is preserved. Other upstream extension fields not mapped by the SDK are not guaranteed to survive. Accept this limitation for the initial release instead of adding a separate transport for nonessential diagnostic fields, and recheck it when upgrading the SDK. See [CitationMetadata](https://ai.google.dev/api/generate-content#CitationMetadata) for the native field definitions.

Use `text/event-stream` for streaming responses and write and flush data promptly rather than buffering until generation completes. Do not add OpenAI's `[DONE]` marker.

Preserve native data such as `candidates`, the original `finishReason`, `promptFeedback`, and `usageMetadata`. Do not replace filtering, length-limit, or tool-output finish reasons with a generic `STOP`.

Continue reading trailing upstream usage and signatures. Do not skip a trailing chunk just because it contains no text.

### Timeouts, Cancellation, and Errors

- Handle validation, authentication, and upstream connection errors before sending SSE response headers. If the SDK defers the request until the first iteration, obtain the first chunk before committing headers.
- Reuse `setAIGatewayStreamHeaders` and existing keepalive utilities, but do not copy the existing handler's ordering of calling `flushHeaders()` before requesting the upstream. Keepalive comments do not count as the first model output.
- Limit each upstream call to 600 seconds overall, using both the SDK timeout and a server-side deadline. Also enforce a 120-second limit without a valid chunk. Use `AbortController` to stop waiting and clean up the connection. Downstream keepalive heartbeats must not reset upstream deadlines. Do not add a configuration page.
- Before headers are sent, preserve upstream 401, 403, 404, 429, and 5xx status codes with a Gemini error object. Return 502 for network failures and 504 for timeouts.
- If an error occurs after SSE starts, emit error data that the target Google SDK recognizes and close the stream. Verify the error format with SDK tests; checking that curl displays `event: error` is insufficient.
- Treat SDK errors, malformed JSON, and incomplete streams as failures without adding a successful completion signal. Accept valid upstream safety-filtered terminal responses.
- When the client cancels or disconnects, abort the local upstream request through the SDK's `abortSignal`, stop reading, clear timers, and finalize the log without leaving it `Pending`. Aborting the client request does not guarantee that the relay or model service stops generation or billing. Record available usage and label unknown portions as unknown.
- Do not add gateway retries in the initial release, and explicitly disable SDK automatic retries. In particular, never replay generation after streaming begins, to avoid duplicate output, tool actions, and usage.

Example Gemini error object:

```json
{
  "error": {
    "code": 400,
    "status": "INVALID_ARGUMENT",
    "message": "Invalid Gemini model path"
  }
}
```

### Preventing Hanging Routes

Add a final API 404 response after the API routes and before the SPA fallback so unmatched `/api/...` requests terminate immediately. Return 405 for incorrect HTTP methods on known Gemini actions.

Also fix the general fallback: branches that do not send HTML must continue to the final 404 handler or explicitly end the response, preventing other unmatched POST requests from hanging. Preserve the existing SPA fallback for frontend page GET requests.

Invalid versions, paths, and unsupported APIs must not return HTML or open an indefinitely waiting SSE connection.

## 8. Token Counting, Logging, and Costs

### Native Token Counting

Call `ai.models.countTokens` using the same relay, upstream key, resolved upstream API version, and effective model. Support the two mutually exclusive REST input forms, `contents` and `generateContentRequest`. Preserve system instructions, tool declarations, and other fields in the latter rather than extracting only text. Apply the fixed-model override to nested models as well. Do not introduce the other input form while preparing SDK parameters.

SDK token-count parameters differ from generation parameters, and some config fields apply only to Vertex AI. Make only the necessary adjustments based on the pinned version's [CountTokensConfig](https://googleapis.github.io/js-genai/release_docs/interfaces/types.CountTokensConfig.html). Use the SDK's `extraBody` for complete native counting requests when needed and inspect the actual outgoing request; a type assertion alone does not prove support.

Return the actual upstream count. If the upstream does not support counting, preserve its error status instead of always returning 501 from Tianji. Do not simulate counting through generation, return a fixed zero, or present tiktoken or character estimates as exact Gemini counts. See the [token counting API](https://ai.google.dev/api/tokens) for the input and `totalTokens` contract. Do not charge count results again as generation usage. If the relay does not support counting, test the target CLI's fallback behavior and record the compatibility limitation.

### Usage and Logs

- Reuse existing request logs, model pricing, and metrics. Create at most one primary log per incoming request. Do not call existing handlers through local HTTP or charge usage twice.
- Store the final effective model in `modelName` and keep `modelProvider` as `custom`. Store the requested model, `gemini` protocol, action, usage source, and error status as gateway metadata in existing JSON logs, not in upstream requests or client responses. Do not add database tables or migrations for this in the initial release.
- Reuse `Pending / Success / Failed` statuses. Record cancellation as `Failed` with a reason. Finalize logs on every termination path and record total duration and time to first valid output.
- Read `promptTokenCount`, `candidatesTokenCount`, `thoughtsTokenCount`, `cachedContentTokenCount`, and related fields from native `usageMetadata`. Map them to existing input, output, and cache fields according to upstream billing semantics while preserving raw values. Cached tokens are a subset of input tokens; thinking and candidate output are counted separately. Do not add `totalTokenCount` to values already counted.
- Streaming usage may be cumulative. Use the final available statistics instead of summing chunks. Do not fabricate measured values for unknown breakdowns. If existing estimates are reused, label them as estimates; unknown usage does not prove zero cost.
- Reuse existing quota alerts without adding a new quota system. Record costs for canceled or failed requests when billable usage is available, and check whether cost aggregations omit `Failed` records. Existing logic filtered to `Success` must not be assumed to provide complete accounting.
- Keep the gateway's existing request/response logging policy and access controls. Do not add key logging or broaden log permissions.

## 9. UI and Code Locations

Add `Gemini CLI` and `Gemini API` to the existing custom gateway code examples, explaining that the upstream must provide a native Gemini API. The relay does not need to use a Google-owned domain. Upstreams that expose only OpenAI APIs are outside this scope.

Show the actual gateway URL and model, or clear placeholders, with one-click copy and instructions to select `Use Gemini API Key`. When a fixed-model override exists, explain its precedence beside the example. Reuse the existing example component without adding a persisted protocol switch. Write UI copy in English and wrap it with `t()`; do not modify JSON files in `src/client/public/locales`.

The existing connection test checks only OpenAI and cannot establish that a Gemini relay works. Do not expand the connection-test UI in the initial release. Explain this limitation in the Gemini examples and validate with native curl examples and real CLI requests.

Relevant code locations:

| Location | Work |
| --- | --- |
| `src/server/router/aiGateway.ts` | Register native Gemini routes and validate versions and actions |
| `src/server/model/aiGateway.ts` | Reuse key resolution, model settings, logging, usage, pricing, and SSE helpers |
| `src/server/model/aiGateway/` | Add one Gemini handler, a few REST / SDK parameter helpers, and corresponding tests |
| `src/server/app.ts` | Fix unterminated responses in API and general fallbacks |
| `src/client/components/aiGateway/AIGatewayCodeExampleBtn.tsx` | Add CLI and native API examples |
| `src/server/package.json`, `pnpm-lock.yaml` | Install and pin the accepted `@google/genai` version |

Use the official SDK and existing validation, authentication, and logging utilities. Do not add a generic provider framework, protocol registry, tool state machine, or message database. Do not fabricate Express req/res objects to call nested handlers. Extract ordinary shared functions only for actual duplication, and avoid unrelated refactoring of other endpoints.

## 10. Acceptance Criteria

| Scenario | Passing criteria |
| --- | --- |
| Basic conversation | The official CLI uses the example configuration, completes three consecutive turns with responses consistent with history, and finishes normally |
| True streaming | A long response produces multiple visible increments before the upstream completes, rather than appearing all at once at the end |
| CLI tool round trip | In a temporary test directory, read a file, modify another test file based on its contents, then read it back to verify; the CLI completes its final answer normally |
| Sequential and parallel tools | The real upstream completes two sequential calls; IDs, arguments, results, and ordering of same-name parallel calls survive the round trip, with no server-side tool execution |
| Signature round trip | After issuing a tool call, the Gemini upstream accepts the result and continues generation without losing signature contents or their association with parts |
| Version and model routing | Explicit saved `/v1` or `/v1beta` overrides the requested version; unversioned URLs preserve it; trailing slashes and relay prefixes work without duplicate version paths; unsupported upstream versions fail explicitly; aliases containing `/` and fixed-model overrides work |
| Token counting | Preserve counting input for both plain contents and complete generateContentRequest forms, comparing results with direct relay calls; preserve errors for unsupported counting and verify CLI fallback |
| Non-streaming SDK | The official Google SDK parses text, tool calls, usage, and finish reasons |
| SDK boundaries | Inspect actual outgoing SDK paths and bodies; preserve thinking, tool schemas, signatures, and safety settings; callers cannot override URLs, keys, versions, or transport options |
| Authentication | Reject invalid or expired keys, users without access to the target workspace, missing gateways, and gateways belonging to another workspace; errors and logs contain no keys or key prefixes |
| Errors and timeouts | Invalid keys, unknown models, 429, 5xx, unresponsive upstreams, and malformed SSE terminate with errors within the expected deadlines |
| Cancellation | CLI cancellation aborts the local SDK request, finalizes logs, and clears timers; this does not establish that upstream billing has stopped |
| Unknown routes | Unknown API paths return JSON 404 within one second in local tests; incorrect methods return 405; frontend page GET requests still work |
| Capability boundaries | Unsupported APIs and top-level request fields fail explicitly; the upstream validates native parameters within supported fields; response limits from the SDK mappings in Section 7 are documented |
| Logs and costs | Verify model, tokens, costs, and status against upstream usage, with no duplicate primary logs or permanently Pending records |
| Regression | Existing OpenAI chat/responses, Anthropic messages, model lists, and frontend page routes remain functional |

Reuse existing Vitest / HTTP test infrastructure. At minimum, cover actual SDK requests, tool and signature round trips, counting, trailing SSE chunks, errors, cancellation, and routing. Write tests in English and use Spanish when localized fixtures are needed. After implementation, run `pnpm check:type`, `pnpm build`, and relevant tests, and deliver verification results from the real Gemini CLI against the target relay. Mocks, curl, or successful builds alone do not establish complete CLI integration.

## 11. Implementation Order and Release Requirements

1. Use the official SDK to verify the target relay's URL, versions, model, and three endpoints, then pin a working SDK version. Do not start by writing a conversion layer.
2. Add the thin handler and routes, complete shared authentication and unmatched-request error handling, and integrate existing logging and pricing.
3. Verify tool and signature round trips, counting, cancellation, usage, and error paths, then add CLI and native API examples.
4. Complete real CLI acceptance testing and regression checks for existing OpenAI / Anthropic endpoints.

The initial release requires all text and tool round-trip acceptance checks to pass. Token counting, or CLI fallback when counting is unsupported, must be verified through actual requests. If the target upstream cannot preserve signatures or missing counting support breaks the CLI, document the compatibility limitations and blockers. A text response alone does not establish complete integration.

Delivery records must include the CLI version, SDK version, relay API version, and test results. This PRD makes no commitments about unverified relay extensions. Defer cross-protocol conversion, AI Router support, and additional Gemini APIs until there is an actual need.

## 12. Implementation and Verification Record

The local implementation uses `@google/genai@2.22.0`, added only as a server dependency. It introduces no database migrations, protocol conversion, upstream transport outside the SDK, or server-side tool execution. Gateway code examples now include Gemini CLI / Gemini API and continue using the existing custom gateway configuration.

Recorded verification environment: Node.js `22.23.2`. The machine's default Node 24 ABI did not match the installed `isolated-vm` binary, so checks used the existing Node 22 installation without rebuilding or changing other environment dependencies.

| Check | Recorded local result |
| --- | --- |
| `pnpm check:type` | shared, client, and server all passed |
| `pnpm build` | Full tracker, server, client, and geo builds passed; existing warnings, including chunk-size warnings, remained |
| `pnpm --filter @tianji/server exec vitest run --exclude '**/dist/**'` | 76 test files passed and 7 skipped; 774 tests passed, 16 skipped, and 1 todo |
| `pnpm --filter @tianji/server exec vitest run model/aiGateway/gemini.spec.ts --exclude '**/dist/**'` | 47 tests passed, using the real official SDK against a local mock HTTP upstream to verify paths, bodies, responses, and cancellation |
| `pnpm --filter @tianji/client exec vitest run --config vitest.component.config.ts components/aiGateway/AIGatewayCodeExampleBtn.component.spec.tsx` | 3 tests passed |
| Full client component suite (same configuration, without a file filter) | 34 files passed and 3 failed; 114 tests passed and 10 failed; see the existing issues below |
| `pnpm -r --if-present test --run` | Blocked by generated tests in `packages/client-sdk/lib/tracker/*.spec.js` requiring Vitest from CommonJS; this does not establish a passing full-workspace test run |

The full client suite failures came from unchanged `AIGatewayDuplicateDialog.component.spec.tsx`, `AIGatewayEditForm.component.spec.tsx`, and `WorkerHourlyCharts.spec.tsx`: their translation mocks provided only `useTranslation`, without the named `t` export used by the components. At verification time, these tests and their components matched HEAD and were left outside the Gemini task's scope.

Independent review identified two protocol / logging issues that were reproduced with failing tests and then fixed with passing regressions: restoring native `citationSources`, and rejecting negative, non-integer, or out-of-range database Int32 usage values. Invalid trailing streaming usage does not overwrite earlier valid usage, and known costs are still recorded with `Failed` status. After shared authentication was tightened, empty gateway fixtures in AI Router success-path tests were also corrected.

The final independent review found no remaining concrete issues requiring a fix. The reviewer ran two consecutive rounds of relevant server tests, with 172 passing each time, plus 8 passing statistics-query tests and 3 passing client example tests. One `ECONNRESET` occurred during verification but did not recur and was not traced to an application defect; it is not described as fixed.

Acceptance testing against a real relay remains pending: the target relay URL and credentials were unavailable, and no real model requests were made. Local mock-upstream tests do not establish real conversation, tool round-trip, or relay compatibility for Gemini CLI `0.59.0` or the stable version available at release. Before release, complete Section 10 acceptance checks and record the relay, API version, model, and CLI version.
