# Website Sidebar 24-Hour PV Design

## Goal

Show each website's page-view count from the previous rolling 24 hours in the Website list, instead of counting every website event.

## Data Definition

A page view matches Tianji's existing Insights definition:

- `eventType` is `EVENT_TYPE.pageView`.
- `eventName` is `null`.
- `createdAt` is greater than or equal to the current time minus one day.

The count is not deduplicated by visitor or session. Custom events and identify requests are excluded.

## Implementation

Keep the existing `website.allOverview` response shape and client rendering unchanged. Add the page-view predicates to the existing `WebsiteEvent.groupBy` query so all consumers receive the corrected count.

No schema, API contract, translation, or UI changes are required.

## Verification

Add a focused server test proving that the overview query counts page views and excludes custom events within the same 24-hour window. Run the focused test and the repository type check.
