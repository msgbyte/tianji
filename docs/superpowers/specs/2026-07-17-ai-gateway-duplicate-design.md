# AI Gateway Duplicate Design

## Goal

Allow workspace administrators to duplicate an AI Gateway while preserving its upstream model API key without sending that secret through the browser or returning it from the duplicate operation.

## Scope

The duplicate contains only the source Gateway's own model configuration:

- `modelApiKey`
- `customModelBaseUrl`
- `customModelName`
- `customModelStrategy`
- `customModelInputPrice`
- `customModelOutputPrice`

The duplicate receives a new ID, creation timestamp, update timestamp, and user-selected name. Historical logs, quota alerts, and AI Router node relationships are not copied.

## User Experience

The AI Gateway detail header shows a duplicate icon button beside the existing edit and delete actions. Like the other mutating controls, it is visible only to workspace administrators.

Selecting the button opens a `Duplicate AI Gateway` dialog. The name field defaults to `<source name> - Copy` and remains editable. The dialog provides Cancel and Duplicate actions. The Duplicate action is disabled for an empty or whitespace-only name; while the request is pending, both closing the dialog and resubmitting are prevented.

On success, the client refreshes the AI Gateway list, closes the dialog, and navigates to the new Gateway's detail page. On failure, the existing error handler displays the error while the dialog and entered name remain available for retry.

New UI strings use the existing `t(...)` translation convention. Files under `src/client/public/locales` are not modified.

## Server API

Add `aiGateway.duplicate` as a `workspaceAdminProcedure` mutation.

Input:

```ts
{
  workspaceId: string;
  gatewayId: string;
  name: string; // trimmed, 1..100 characters
}
```

The mutation queries the source with both `workspaceId` and `gatewayId`. A missing source returns a `NOT_FOUND` tRPC error with the message `AI Gateway not found`.

The source query selects only the six configuration fields required for the copy. The subsequent create writes those fields, the current workspace ID, and the validated name. Relations are omitted so Prisma creates no dependent records.

Output:

```ts
{
  id: string;
  name: string;
}
```

A dedicated output schema is used instead of `AIGatewayModelSchema`, ensuring the duplicate response cannot contain `modelApiKey` or other configuration data.

## Secret-Handling Boundary

The browser never receives the source token as part of this workflow:

1. The UI sends only `workspaceId`, `gatewayId`, and `name`.
2. The server reads `modelApiKey` directly from the database and passes it directly to Prisma create.
3. Neither successful output nor expected error messages include source configuration.
4. The mutation input contains no secret, so it does not require an entry in the client tRPC logger's sensitive-operation exclusion set.

This design protects the duplicate path even though the existing edit query currently supplies configuration to the edit screen. Changing the broader edit/read API contract is outside this feature's scope because it would require a separate secret replacement design.

## Error Handling

- Invalid names fail input validation before database access.
- Cross-workspace or nonexistent source IDs return `NOT_FOUND` without revealing whether that ID exists elsewhere.
- Database failures propagate through the standard tRPC error handling. The server does not interpolate source data into error messages.
- The client keeps the dialog open after mutation failure and relies on `defaultErrorHandler` for feedback.

## Testing

Server router tests will verify:

- A source outside the current workspace is rejected and no create occurs.
- All six Gateway configuration fields, including `modelApiKey`, are copied server-to-server.
- The response is exactly `{ id, name }` and its serialized form does not contain the token.
- Logs, quota alerts, and AI Router relationships are absent from the create payload.
- Whitespace-only and overlength names fail validation.

Client component tests will verify:

- Only administrators see the duplicate action.
- Opening the dialog uses the expected default name.
- Submission sends only `workspaceId`, `gatewayId`, and the trimmed name.
- Successful duplication refreshes the list and navigates to the new Gateway.
- Empty names and pending requests cannot submit twice.
- Failure leaves the dialog and name intact.

Final verification runs the focused server and client Vitest suites, `pnpm check:type`, and `pnpm build`.

## Out of Scope

- Copying logs, analytics, quota alerts, or AI Router membership
- Cross-workspace duplication
- Bulk duplication
- Changing the existing edit/read secret contract
- Modifying generated translation JSON files
