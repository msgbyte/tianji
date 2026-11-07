---
sidebar_position: 9
title: Artifacts
---

Artifacts are HTML pages saved in a Tianji workspace. Ask your AI agent to create a report, interactive visualization, or prototype, publish it through the API, and return a link. Workspace members can open **Artifacts** in the dashboard to search pages, preview them, inspect their source, and download the original HTML.

Artifacts is an experimental feature. Enable **Alpha Mode** under **Profile → Settings** to show it in desktop and mobile navigation. The switch is off by default and saved in the current browser. It controls navigation visibility; API access and direct links still use the workspace permissions below.

The workflow follows [Claude Artifacts](https://code.claude.com/docs/en/artifacts): publish a local HTML file, keep its link when editing, and reject stale updates. Tianji uses its own workspace permissions and preview runtime. Claude-specific APIs and connectors are not available.

## Install the Skill

Download the [Artifacts Skill archive](https://tianji.dev/skills/tianji-artifacts.tar.gz), or install it from your terminal.

For Claude Code:

```bash
mkdir -p ~/.claude/skills
curl -fsSL https://tianji.dev/skills/tianji-artifacts.tar.gz | tar -xz -C ~/.claude/skills
```

For Codex:

```bash
mkdir -p ~/.agents/skills
curl -fsSL https://tianji.dev/skills/tianji-artifacts.tar.gz | tar -xz -C ~/.agents/skills
```

Set these variables in the environment where your agent runs, then restart the agent:

```bash
export TIANJI_SERVER_URL="https://your-tianji.example.com"
export TIANJI_WORKSPACE_ID="<your-workspace-id>"
export TIANJI_API_KEY="<your-api-key>"
```

Use the instance origin without `/open`. The dashboard's **Install Skill** dialog includes your current server and workspace values. Create or manage your personal key under **Settings → API Keys**. Keep it in your local agent environment; do not paste it into HTML or commit it to a repository.

Then ask your agent:

> Create an interactive HTML report from these figures and publish it to my Tianji workspace using the tianji-artifacts Skill. Return its dashboard link.

The Skill includes a Python 3 upload example that reads a local file, safely encodes JSON, checks the server's OpenAPI contract, and handles revision conflicts. It requires an instance with the Artifacts API; an older Tianji instance must be upgraded first.

## Build React artifacts

The downloadable Skill also includes a preconfigured **React 18 + TypeScript +
Tailwind CSS 3 + shadcn/ui** project, with 44 UI components, Lucide icons, path
aliases, and locked dependency versions. It follows Anthropic's public
[web-artifacts-builder workflow](https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder):
initialize a project, let the AI edit it, and bundle it into one HTML file.

With Node.js 22+, pnpm 10.27.0, Bash, and tar installed:

```bash
# For Codex, use "$HOME/.agents/skills/tianji-artifacts" instead.
SKILL_DIR="$HOME/.claude/skills/tianji-artifacts"
bash "$SKILL_DIR/scripts/init-artifact.sh" ./my-report
cd my-report
# Edit src/App.tsx; use pnpm dev for local development.
bash "$SKILL_DIR/scripts/bundle-artifact.sh"
```

Initialization installs dependencies from the npm registry and refuses to
overwrite an existing directory. The build type-checks the project and produces
`bundle.html` with JavaScript, CSS, and imported assets embedded. It rejects
additional emitted files and output above Tianji's 1 MiB limit. Tianji uses Vite
for single-file bundling instead of the official Skill's Parcel toolchain.

Ask the agent to preview the finished page and upload `bundle.html` through the
Artifacts API. The build itself does not publish. Keep the generated project for
future edits. Simple HTML pages can still be uploaded directly without a
scaffold. The preview restrictions below apply to every artifact, including
compiled React pages; a local development preview alone does not verify them.

## Permissions and links

| Workspace role | Read, preview, download | Create and update | Delete |
| -------------- | ----------------------- | ----------------- | ------ |
| Read-only      | Yes                     | No                | No     |
| Write          | Yes                     | Yes               | No     |
| Admin or owner | Yes                     | Yes               | Yes    |

Keys belong to users. Every request checks current workspace membership and role. Writers can update any artifact in their workspace. Successful creates, updates, and deletes appear in the workspace audit log with the HTML source redacted.

Artifact links look like `/artifacts/<id>?workspaceId=<workspace-id>`. They require login and workspace access. If another workspace is selected, the dashboard asks you to switch before loading the page. These are private dashboard links, not anonymous hosting links.

## API

Authenticate with `Authorization: Bearer <your-api-key>`. Inspect `GET /open/_document` on your instance for the current schema. All paths below start with `/open/workspace/{workspaceId}/artifacts`:

| Method   | Suffix          | Input / response                                                                                        |
| -------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `GET`    | none            | Optional `search`, `page` (default 1), `pageSize` (default 50, maximum 100); returns `{items, hasMore}` |
| `POST`   | none            | `title`, optional `description`, `source`; returns metadata                                             |
| `GET`    | `/{artifactId}` | Returns metadata and `source`                                                                           |
| `PUT`    | `/{artifactId}` | Complete `title`, `description`, `source`, `expectedRevision`; returns metadata                         |
| `DELETE` | `/{artifactId}` | Returns `{id}`                                                                                          |

Metadata includes the ID, workspace, title, description, revision, authors, ISO timestamps, and a relative dashboard `path`. Listing returns metadata only. Resolve the returned path against your instance origin.

Example POST body:

```json
{
  "title": "Quarterly report",
  "description": "An interactive summary for the team",
  "source": "<!doctype html><html><body><button onclick=\"this.textContent='Ready'\">Open report</button></body></html>"
}
```

Titles are trimmed and must contain 1–200 characters. Descriptions can contain up to 2,000 characters. Source must be nonblank and at most **1 MiB measured as UTF-8 bytes**. The outer JSON request also has a 10 MB transport ceiling. Read the HTML file with a JSON encoder; do not interpolate raw HTML into a shell command.

### Update an existing page

1. GET the artifact and retain its `id`, `workspaceId`, `revision`, and `source` together.
2. Edit that source and its metadata locally.
3. PUT the complete replacement with `expectedRevision` set to the revision you read.
4. Use the returned revision for subsequent work. The dashboard link stays the same.

HTTP **409** means another update won. Read the newer source, reconcile the changes, and retry with its revision. There is no force-overwrite option. Revision numbers prevent lost updates; Tianji stores only the current document, without revision history or rollback.

After a timeout or disconnect, inspect the current artifact before retrying. Repeating POST can create a duplicate; search recent artifacts and compare their source to determine whether the original request succeeded. Titles are not unique identifiers. The Skill does not blindly retry writes.

HTTP **401/403** indicates invalid credentials or insufficient permissions, **404** indicates a missing artifact, and **400/413** indicates invalid or oversized input.

## Preview runtime

Preview runs interactive HTML in an isolated iframe. Use one self-contained HTML file with embedded data:

- Inline JavaScript and CSS work. Compile React/JSX to ordinary JavaScript before uploading; dynamic evaluation is blocked.
- External scripts can load from the exact HTTPS hosts `cdnjs.cloudflare.com`, `unpkg.com`, `cdn.jsdelivr.net/npm/`, `cdn.tailwindcss.com`, and `code.jquery.com`. Google Fonts stylesheets and fonts are allowed.
- Images and media must use data or blob URLs. Fonts may also use data URLs. Relative files and other external stylesheets are blocked.
- The page cannot read the dashboard DOM, cookies, or local storage. Network fetches, form submissions, nested frames, workers, popups, and top-level navigation are blocked. There is no privileged message bridge or access to agent credentials.

Select **Source** to stop the running preview. Workspace changes also remove the previous preview. The sandbox is not a virtual machine or a complete network air gap: allowed CDNs receive resource requests, a page can navigate its own frame, and heavy scripts can consume browser resources.

**Download HTML** saves the original source. Opening that file locally runs it outside Tianji's preview restrictions.

This version supports workspace-private HTML pages. Public sharing, retained revisions, server-side execution, multiple-file bundles, and automatic JSX compilation are outside its scope.
