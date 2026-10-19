# AI Gateway Connectivity Test Design

## Summary

The AI Gateway edit page should let a workspace administrator test the current,
unsaved custom gateway configuration before updating it. The test uses the same
OpenAI-compatible upstream behavior as the AI Gateway `custom` route and sends a
minimal non-streaming chat completion.

The connection test is an administrative validation action. It does not save the
form, update the gateway cache, or create AI Gateway usage logs.

## Goals

- Add a `Test Connection` action to the existing AI Gateway edit form.
- Test the API key, custom base URL, and custom model name currently entered in
  the form, including unsaved changes.
- Use the custom OpenAI-compatible upstream path rather than a built-in provider
  such as OpenAI, Anthropic, DeepSeek, or OpenRouter.
- Select the first model returned by `/v1/models` when the custom model name is
  empty.
- Report a useful success or failure result without exposing the API key.

## Non-Goals

- Do not add the action to the AI Gateway creation page.
- Do not save or temporarily persist form values during a test.
- Do not add test requests to AI Gateway analytics or request logs.
- Do not test the built-in provider-specific routes.
- Do not modify translation JSON files under `src/client/public/locales`.

## User Interface

Extend `AIGatewayEditForm` with an optional connection-test callback. The edit
route supplies the callback, while the creation route does not, so only the edit
page renders the new action.

Place an outline `Test Connection` button next to the existing `Update` button.
The button uses `type="button"` so it cannot submit the update form. Clicking it
validates the current form before starting the request. While the request is in
progress, the button shows its loading state and cannot start a duplicate test.

On success, show a toast that identifies the model used and the elapsed request
time. On failure, show the upstream or validation error through the existing
client error presentation. Testing must not reset the form or navigate away.

## Server API

Add an `aiGateway.testConnection` workspace-admin mutation. Its input contains:

```ts
{
  workspaceId: string;
  gatewayId: string;
  modelApiKey: string;
  customModelBaseUrl: string | null;
  customModelName: string | null;
}
```

The mutation verifies that `gatewayId` belongs to `workspaceId`, then invokes a
focused custom-connectivity service with the transient input values. It returns:

```ts
{
  model: string;
  durationMs: number;
}
```

This remains a tRPC-only administrative operation and does not expand the public
AI Gateway HTTP API.

## Custom Request Flow

The connectivity service constructs an OpenAI client with the submitted API key
and custom base URL, using the same client configuration semantics as
`/api/ai/:workspaceId/:gatewayId/custom/v1/*`. It does not make an HTTP request
back into Tianji's public custom route because that route intentionally reads the
saved gateway configuration, which would ignore unsaved form values.

The service selects a model as follows:

1. Trim `customModelName`.
2. If it is non-empty, use it directly and do not request the model list.
3. If it is empty, call the upstream OpenAI-compatible `GET /v1/models` endpoint.
4. Use the first returned model ID.
5. If the upstream returns no models, fail with an explicit error instead of
   sending an invalid completion request.

After selecting the model, send one non-streaming chat completion containing a
single user message, `Reply with OK.`, and `max_tokens: 1`. A successful upstream
completion is sufficient; the test does not require the response text to equal
`OK`.

Configure the client with no automatic retries and a 15-second timeout for each
upstream request. `durationMs` measures the complete model-selection and chat
completion flow.

## Validation And Error Handling

- Apply the existing form URL validation before invoking the mutation.
- Normalize empty optional strings to `null` at the route boundary.
- Require `modelApiKey` for the UI connection test. Unlike a normal custom-route
  request, this administrative action has no end-user authorization header to
  use as a fallback upstream credential.
- Preserve useful upstream authentication, model, network, and timeout messages
  in the tRPC error shown to the administrator.
- Never include the submitted API key in the response, logs, toast text, or
  thrown error messages created by Tianji. Remove an exact key match from any
  upstream error message before returning it.
- Do not update gateway cache state regardless of success or failure.

## Testing

Server tests cover:

- A supplied custom model name skips `/v1/models` and is used for the completion.
- An empty custom model name requests `/v1/models` and uses the first model.
- An empty model list produces an explicit failure.
- The completion is non-streaming and uses a minimal request payload.
- The tRPC mutation rejects a gateway outside the current workspace.
- The mutation returns the selected model and elapsed time without returning the
  API key.

Client component tests cover:

- The optional action is rendered on edit and omitted when no test callback is
  supplied.
- Clicking the action validates and passes the current unsaved form values.
- The action does not call the update submit callback.
- Loading and success/error feedback use the test mutation state without
  resetting the form.

## Rollout

The change requires no database migration and does not alter existing gateway
runtime behavior. Existing edit and create flows continue unchanged unless the
administrator explicitly clicks `Test Connection`.
