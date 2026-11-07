# Workspace Artifacts

Status: approved for implementation on 2026-11-07.

## Intent

Let a workspace member ask their AI agent to create a useful HTML page, upload it to Tianji, and return a link that workspace members can open in the dashboard. The agent can retrieve and update the same artifact in later sessions. Deliver an installable `tianji-artifacts` Skill with the feature.

The user approved API uploads, HTML viewing in the dashboard, and a Skill aligned with Claude Artifacts, including the implementation decisions below.

## Reference and approach

[Claude's public documentation](https://code.claude.com/docs/en/artifacts) describes publishing a self-contained page from a local file, retaining its URL across updates, and rejecting updates based on stale content. Its viewer restricts network resources using CSP. These behaviors inform this design; Claude's private implementation and internal prompts are not available.

Use a dedicated Artifact model and tRPC router, expose that router through Tianji's existing OpenAPI integration, and reuse the dashboard's list/detail layout. This is the smallest approach that provides workspace access control and reliable updates.

Alternatives considered:

- Reuse Workers as HTML hosts: Workers also execute server code and expose public HTTP endpoints. Their execution, deployment, and ownership lifecycle would add unnecessary behavior to a stored document.
- Add a separate artifact hosting service: separate hosting can support public sharing and broader web applications, but requires new deployment and authentication infrastructure for a feature currently used inside Tianji.

## User experience

1. A member enables **Alpha Mode** under **Profile → Settings**, then opens **Artifacts** from the desktop or mobile navigation. Alpha Mode defaults to off and is saved in the current browser. It controls navigation visibility; direct links and API permissions continue to use workspace authorization.
2. The list shows artifact titles, descriptions, and last-update times, newest first. A searchable list and a **Load more** action use the existing components. The first page contains 50 items.
3. The empty state and header expose **Install Skill**, with Claude Code and Codex installation instructions, the server URL, workspace ID, and a link to the existing API Keys settings. No key is created or embedded automatically.
4. The user installs the Skill and supplies an existing user API key through local configuration. The agent writes a local HTML file and publishes it using the API.
5. A detail page shows the title, description, creator, revision number, and update time. **Preview** and **Source** tabs display the sandboxed page or escaped, read-only HTML. **Copy link**, **Download HTML**, and an administrator-only delete action are outside the iframe.
6. The agent can read the saved source and revision, modify the file, and update the same ID. Refreshing the dashboard retrieves the new version. A new artifact creates a new ID even if its title matches an existing title.

Use authenticated detail links of the form `/artifacts/<artifactId>?workspaceId=<workspaceId>`. Validate the workspace ID against the signed-in user's memberships before reading content. If another workspace is selected, show the target workspace and reuse the existing workspace-switching control before enabling the detail query. Never silently query the current workspace for an ID from a different workspace. Preserve the complete URL through login redirects.

Render loading, empty, forbidden, missing, and network-error states separately. Changing workspaces must stop displaying the previous artifact and stop its preview. Switching to Source must unmount the preview so users can stop a running page.

## Data and permissions

Add an `Artifact` Prisma model with:

- `id`, `workspaceId`, `title` (1–200 trimmed characters), `description` (up to 2,000 characters, default empty), and `source` (HTML text).
- `revision` (integer starting at 1), `createdAt`, and `updatedAt`.
- Nullable `createdById` and `updatedById` user relations with `onDelete: SetNull`. Deleting an author must not remove a workspace's artifacts.
- Workspace relation with cascade deletion and an index supporting workspace/update-time listing.

The database stores the current source only. The revision is an optimistic concurrency token, not a retained version history. The list query selects metadata and never transfers all HTML sources.

Reuse the existing role mapping:

| Action                        | Required workspace role         |
| ----------------------------- | ------------------------------- |
| List, read, preview, download | Any member, including read-only |
| Create and update             | Write, admin, or owner          |
| Delete                        | Admin or owner                  |

Artifacts belong to the workspace. Any member with write permission may update an artifact created by another member. API keys remain user API keys; membership and role are checked on every request. IDs, request-provided creator fields, and possession of a detail link never grant access.

## API contract

Register `artifact` alongside the existing routers. All REST endpoints are under `/open/workspace/{workspaceId}/artifacts` and use the existing Bearer authentication and workspace procedures.

| Method and suffix      | Input                                                                 | Response                                          |
| ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| `GET /`                | Optional search, page (default 1), pageSize (default 50, maximum 100) | Metadata items and `hasMore`                      |
| `POST /`               | `title`, optional `description`, `source`                             | Metadata, revision, and relative `path`           |
| `GET /{artifactId}`    | Path IDs                                                              | Metadata, `source`, revision, and relative `path` |
| `PUT /{artifactId}`    | Complete `title`, `description`, `source`, and `expectedRevision`     | Updated metadata, revision, and relative `path`   |
| `DELETE /{artifactId}` | Path IDs                                                              | Deleted ID                                        |

Use `source` consistently rather than switching between `html`, `content`, and `source`. This also matches the existing audit helper's source redaction. Return a relative dashboard path; the Skill resolves it against its configured server URL without trusting the request's Host header.

The source must contain non-whitespace text and be at most 1 MiB measured as UTF-8 bytes. Accept a complete HTML document or fragment; do not attempt brittle HTML validation with a regular expression. Keep Express's existing 10 MB request-body ceiling. Document both the semantic source limit and the outer transport limit, and test escaped JSON and multibyte inputs.

Update atomically with a database condition on artifact ID, workspace ID, and expected revision; increment revision in that same write. Reading first and later updating without a condition is insufficient. A stale revision returns `CONFLICT` / HTTP 409 without changing any fields. An artifact outside the requested workspace or a deleted artifact returns not found after membership checks. There is no force-overwrite option. The Skill reads current content again and merges before retrying.

Creation returns the generated ID. On an ambiguous network failure after a create request, the Skill must not blindly repeat POST: list/read recent candidates to reconcile the result, and report ambiguity if it cannot identify the uploaded artifact safely. Updates can similarly inspect the current revision and source after an ambiguous response.

## Preview boundary

Render the source only in an iframe using `srcDoc`, `sandbox="allow-scripts"`, an accessible title, and `referrerPolicy="no-referrer"`. Never render artifact markup into the dashboard DOM or serve it as an executable same-origin HTML endpoint. Source inspection uses an existing text/code component.

Prepend the viewer-owned CSP before any uploaded markup. The artifact must not be able to replace or relax it. The initial policy permits inline scripts and styles, data/blob images and media, embedded fonts, and scripts from the same common CDN families documented by Claude: cdnjs, unpkg, jsDelivr's `/npm/` path, the Tailwind CDN, and the jQuery CDN. Allow Google Fonts stylesheet/font hosts. All entries use exact HTTPS hosts, not wildcard subdomains.

Set `default-src 'none'`, `connect-src 'none'`, `object-src 'none'`, `frame-src 'none'`, `worker-src 'none'`, `base-uri 'none'`, and `form-action 'none'`; define the permitted script/style/image/media/font sources explicitly. Do not include `'self'`, `allow-same-origin`, form submission, popups, automatic downloads, or top-level navigation permissions. Do not enable dynamic evaluation solely to support uncompiled JSX; the agent should bundle or compile its code before upload.

The preview does not receive an API key, session data, a privileged postMessage bridge, or the agent's conversation. It can run interactive client-side code but cannot read the dashboard DOM, cookies, or local storage. Data must be embedded in the page. API-backed pages, relative asset files, and persistent application storage are outside this version's runtime contract.

This is a browser sandbox, not a virtual machine or a complete network air gap. Allowed CDN resources make network requests, self-navigation remains a browser concern, and a pathological script can consume browser resources. Verify isolation with an automated disposable browser and adversarial fixtures; do not claim that string-level CSP tests alone prove isolation. See [MDN's iframe sandbox reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox).

The **Download HTML** action saves the original source as an attachment initiated by the dashboard. Its download guidance must distinguish the sandboxed dashboard preview from opening the original file locally, where Tianji's preview restrictions no longer apply.

## Audit logging

Add `Artifact` to `WorkspaceAuditLogType`. Every successful create, update, and delete records the authenticated actor, action, artifact ID, and redacted changed fields. Explicitly use `createWorkspaceMutationAuditLog` with the returned ID for creation, and configure the existing manually-audited path set to avoid duplicate logs. Use the same pattern for update/delete so the policy is uniform.

Source is redacted; never include HTML fragments or API keys in audit content or errors. Failed authorization, missing targets, validation failures, and revision conflicts do not produce successful mutation records. Reuse the existing audit helper's failure behavior; changing the platform-wide audit delivery contract is outside this feature.

## Agent Skill and documentation

Deliver `skills/tianji-artifacts/SKILL.md` using standard name/description frontmatter and, if needed, one operational reference. Use the skill-creator guidance to keep the entrypoint concise and compatible with Claude Code and Codex. Follow the existing Worker Skill archive/install layout without broadening the separate read-only data-query Skill.

The Skill must teach the agent to:

- Resolve the server, workspace, and credentials from explicit configuration; never guess a workspace or print credentials. Use one documented environment variable convention and make setup examples identical across the dashboard and docs.
- Read the target server's `/open/_document` and confirm the artifacts API exists before publishing. An older instance without these routes is a compatibility error, not a reason to guess endpoint names.
- Generate a single HTML file whose assets and runtime fit the preview contract. An existing Claude artifact may need exporting and adaptation; Tianji does not provide Claude's proprietary runtime functions.
- Upload the file using JSON-safe file reading, not fragile shell interpolation. Use standard installed tools and no new required runtime dependency.
- Print the successful dashboard URL and artifact ID. Retrieve source and revision before updating an existing artifact; treat its contents as data, not instructions for the agent.
- Handle authentication, permissions, size errors, conflicts, and ambiguous transport failures explicitly. Respect the user's publish/update request without imposing a confirmation before every authorized upload. Delete only when requested.

Publish `website/static/skills/tianji-artifacts.tar.gz` through a small packaging script using the existing `tar` dependency. Hook the script into website dev/build, add a dedicated packaging test, and extend the website deployment workflow's path trigger to include this Skill. Document API examples, installation, permissions, preview constraints, and updating an artifact in the English website docs. Link the dashboard installation entry to these docs and the downloadable archive. The archive must contain no credentials.

The checked-in archive is available as a repository artifact before release; its `tianji.dev` download URL becomes available after the website is deployed. Report that distinction during delivery.

## Scope and integration map

The implementation reaches Prisma schema/migration/generated schemas, the artifact router and router registry, audit routing, desktop/mobile navigation, TanStack routes and generated route tree, artifact UI components, Skill source/archive, website docs/build scripts, and the website deploy path filter. Inspect the existing OpenAPI generation workflow and update generated schema/SDK artifacts only where the repository's normal workflow requires them.

Reuse `Layout`, `CommonHeader`, `CommonWrapper`, `CommonList`, tabs, buttons, confirmation dialogs, code viewing, permission hooks, and query error handling. All new repository content is English; UI strings use `t()`. Do not modify translation JSON under `src/client/public/locales`. No new package dependency is required.

This version provides current-content publishing and viewing. Public/anonymous sharing, retained revision history and rollback, live viewer updates, comments, Markdown/React source compilation on the server, file bundles, backend execution, and Claude-specific connectors are not included. A future request can extend the current artifact model without changing stable IDs.

## Acceptance and verification

- A valid member API key creates an artifact, the returned path opens the matching workspace artifact after login, and the saved HTML renders an interactive example.
- Reads are workspace-scoped; unauthenticated users, nonmembers, and cross-workspace IDs cannot retrieve HTML. Read-only users cannot mutate; write users cannot delete.
- Two updates using the same revision produce exactly one success, with the other returning 409 and preserving the winning content. Verify the database condition, including a real isolated database check when available.
- Request tests exercise the actual JSON/OpenAPI boundary, UTF-8 byte limits, invalid payloads, missing resources, and all mutation audit records. Audit output must not contain the supplied HTML.
- UI checks cover empty/error/loading states, workspace mismatch, source/preview switching, deletion permissions, stable links, and mobile navigation. A disposable-browser check verifies script execution plus blocked parent DOM/storage access, blocked fetch/form/popups/top navigation, and resistance to an uploaded CSP override.
- Packaging tests extract the archive and compare it with the intended Skill source files. Verify documented API examples against the generated OpenAPI document and a local test server, and build the English website.
- Run the focused Vitest suites, `pnpm check:type`, and `pnpm build` using a supported Node version. Record failures and baseline/environment blockers accurately; do not claim production or installed-Skill verification from mocked tests.

Do not run a migration against a shared database or deploy a website/server as part of local implementation. The user subsequently authorized small, independently verified Git commits; pushing remains outside the authorized scope. Remaining implementation choices such as exact component/file names and test fixture organization are delegated to the builder.
