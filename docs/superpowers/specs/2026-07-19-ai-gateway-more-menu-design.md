# AI Gateway More Menu Design

## Goal

Reduce clutter in the AI Gateway detail header by grouping the administrator-only Duplicate, Edit, and Delete actions under one More menu. The Code Example action remains directly visible.

## User Experience

The detail header keeps the existing Code Example button. Administrators also see one outlined icon button with a vertical ellipsis and an accessible `More` label. Non-administrators do not see the More button or any of its actions.

Opening the menu shows these items in order:

1. Edit
2. Duplicate
3. Delete

Each item retains its existing icon. Delete uses the repository's existing destructive menu-item styling and still requires confirmation before the mutation runs. Edit navigates to the current edit route. Duplicate opens the existing duplicate-name dialog and preserves its current submission, refresh, navigation, and server-side secret-handling behavior.

New UI strings use the existing `t(...)` convention. Files under `src/client/public/locales` are not modified.

## Component Design

Add an AI Gateway-specific actions-menu component rather than placing all menu state in the detail route or introducing a generic CRUD abstraction.

The component receives the current Gateway ID and name plus callbacks for edit and confirmed deletion. It owns the dropdown presentation and the state needed to open the existing duplicate dialog from a menu item. The detail route remains responsible for permission gating, navigation, and deletion because those behaviors already live there.

The duplicate dialog will support being opened from the menu without changing its mutation contract. Its standalone icon trigger is removed from the detail header. No server API or database code changes are required.

## Interaction and Error Handling

- Selecting Edit closes the menu and navigates to `/aiGateway/$gatewayId/edit`.
- Selecting Duplicate closes the menu and opens the duplicate dialog with the same bounded default name as today.
- Selecting Delete keeps the destructive action behind `AlertConfirm`; dismissing the confirmation performs no mutation.
- Duplicate mutation failures continue to use `defaultErrorHandler` and keep the dialog available for retry.
- Delete mutation and navigation behavior remain unchanged.

## Testing

Use focused component tests to verify:

- Administrators see Code Example and one More button instead of three separate action buttons.
- Non-administrators see Code Example but not More.
- Opening More exposes Edit, Duplicate, and Delete in the expected order.
- Edit invokes navigation to the existing edit route.
- Duplicate opens the existing dialog flow.
- Delete remains destructive and invokes deletion only after confirmation.

Run the focused AI Gateway client tests first, followed by the client test suite relevant to this route and `pnpm check:type`. Run `pnpm build` as the final production verification required by the contributor guide.

## Out of Scope

- Moving Code Example into the More menu
- Changing administrator permissions
- Changing duplicate or delete server behavior
- Creating a generic application-wide action-menu abstraction
- Modifying translation JSON files
