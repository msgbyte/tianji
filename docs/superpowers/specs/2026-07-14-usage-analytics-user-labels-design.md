# Usage Analytics User Labels Design

## Goal

Display users in all three AI Gateway Usage Analytics user charts as
`name (userId)` instead of showing only the raw user ID.

## Name Resolution

The client will load the current workspace members and resolve each chart
group's `userId` with this priority:

1. The member's non-empty `nickname`.
2. The member's `username`.
3. The original `userId` when the member cannot be resolved.

Resolved users are rendered as `name (userId)`. The fallback remains the raw
ID without additional punctuation so historical data for removed users stays
readable.

## Architecture and Data Flow

The existing insights query continues to group AI Gateway logs by `userId`.
`AIGatewayAnalytics` uses the existing `workspace.members` query to build a
user-ID-to-display-label map and passes a stable formatter to each of the three
user charts.

`InsightQueryChart` forwards an optional group-value formatter to
`useInsightsData`. During series-name generation, the formatter changes only
the display value used in chart data keys and chart configuration labels. It
does not change the query, grouping, metric values, or raw response.

The formatter is optional, so every existing chart without it preserves its
current behavior.

## Scope

The formatter is applied to:

- Request Count by User
- Cost by User
- Token Usage by User

No locale JSON files, AI Gateway log records, insights SQL, or unrelated chart
labels are changed.

## Error and Loading Behavior

Charts may render before workspace-member data is available. Until resolution
is possible, labels fall back to raw IDs. Once member data arrives, memoized
chart processing reruns and replaces known IDs with resolved labels.

An unknown or removed user never produces an empty label.

## Testing

Focused unit tests for insights data processing will verify:

- a supplied formatter changes grouped series labels;
- grouped data values remain unchanged;
- processing without a formatter remains backward compatible;
- an unresolved ID stays visible through the formatter's fallback.

Type checking and the production build will provide integration-level
verification after the focused tests pass.
