# Artifacts API operations

Use the configured instance origin and Bearer key. Do not log headers or credentials. Prefer HTTPS; use HTTP only for an explicitly configured development or trusted local instance. Do not forward credentials to redirect targets.

## Contract

Inspect `GET /open/_document` on the configured server. The OpenAPI paths below are relative to `/open`:

| Method | Path                                              | Input / result                                                                                         |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| GET    | `/workspace/{workspaceId}/artifacts`              | Optional `search`, `page` (1), `pageSize` (50, max 100); returns `{items, hasMore}` with metadata only |
| POST   | `/workspace/{workspaceId}/artifacts`              | `title`, optional `description`, `source`; returns metadata                                            |
| GET    | `/workspace/{workspaceId}/artifacts/{artifactId}` | Returns metadata and `source`                                                                          |
| PUT    | `/workspace/{workspaceId}/artifacts/{artifactId}` | Complete `title`, `description`, `source`, `expectedRevision`; returns metadata                        |
| DELETE | `/workspace/{workspaceId}/artifacts/{artifactId}` | Returns `{id}`                                                                                         |

Metadata includes `id`, `workspaceId`, `title`, `description`, `revision`, author IDs, `createdBy`, ISO timestamps, and a relative dashboard `path`. Resolve that path against `TIANJI_SERVER_URL`. New artifacts always receive a new ID, even when titles match.

Any member can read; write/admin/owner can create or update; admin/owner can delete. A writer may update another member's artifact in the same workspace.

## Publish a local file

Prepare `page.html` and a UTF-8 `artifact.json` containing a title and description, for example:

```json
{ "title": "Quarterly report", "description": "Revenue and retention overview" }
```

Save the following Python 3 example as a temporary `publish_artifact.py`, then run `python3 publish_artifact.py page.html artifact.json`. It reads credentials from the environment, checks the server contract, encodes the file safely, and prints only the resulting ID, revision, and link. It does not retry failed requests.

```python
import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.parse
import urllib.request

server = os.environ["TIANJI_SERVER_URL"].rstrip("/")
workspace = os.environ["TIANJI_WORKSPACE_ID"]
key = os.environ["TIANJI_API_KEY"]

class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

client = urllib.request.build_opener(NoRedirects())

def request(method, path, payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(server + path, data=data, method=method,
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    try:
        with client.open(req, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise SystemExit(f"HTTP {error.code}. Inspect the result before retrying a write.")
    except (urllib.error.URLError, TimeoutError):
        raise SystemExit("Transport failure: the write outcome may be unknown. Inspect before retrying.")

source = Path(sys.argv[1]).read_text(encoding="utf-8")
metadata = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
if not source.strip() or len(source.encode("utf-8")) > 1024 * 1024:
    raise SystemExit("HTML must be nonblank and at most 1 MiB in UTF-8.")
updating = "id" in metadata
if updating and metadata.get("workspaceId") != workspace:
    raise SystemExit("The saved artifact belongs to another workspace.")
schema_path = "/workspace/{workspaceId}/artifacts" + ("/{artifactId}" if updating else "")
method = "PUT" if updating else "POST"
document = request("GET", "/open/_document")
if method.lower() not in document.get("paths", {}).get(schema_path, {}):
    raise SystemExit("This Tianji server does not support the required Artifacts operation.")
path = "/open/workspace/" + urllib.parse.quote(workspace, safe="") + "/artifacts"
payload = {"title": metadata["title"], "description": metadata.get("description", ""), "source": source}
if updating:
    path += "/" + urllib.parse.quote(metadata["id"], safe="")
    payload["expectedRevision"] = metadata["revision"]
result = request(method, path, payload)
print(json.dumps({"id": result["id"], "revision": result["revision"],
    "url": urllib.parse.urljoin(server + "/", result["path"])}))
```

For an update, first GET the existing artifact and save the complete response as `artifact.json`. Save its `source` to `page.html`, edit that file and the desired metadata, then run the same example. Keep the saved `id`, `workspaceId`, and `revision`; do not fetch a fresh revision immediately before PUT without reconciling its corresponding content. PUT replaces the complete document. Save the new ID/revision or retrieve again before later edits.

## Failures

- **400:** Check title (trimmed, 1–200 characters), description (max 2,000), nonblank source (max 1 MiB UTF-8), and integer revision. The outer JSON request also has a 10 MB transport ceiling.
- **401:** Configure a valid user API key locally.
- **403:** The user lacks membership or the required workspace role.
- **404:** The artifact is missing in that workspace, or the instance lacks this API. Check the OpenAPI document and explicit workspace; do not probe other workspaces.
- **409:** A different update won. GET the new source and revision, merge the intended edit, and then PUT with that revision. There is no force option.
- **413:** The outer JSON request exceeded the server's transport limit.
- **Redirect, timeout, disconnect, or 5xx:** Do not blindly repeat a write. For create, list recent candidates and compare their saved source; matching a title alone is insufficient. For update, GET the current revision and source to determine whether it succeeded. Report uncertainty if reconciliation is inconclusive.

## Preview runtime

Inline scripts/styles are allowed. External scripts may use these exact HTTPS CDN hosts: `cdnjs.cloudflare.com`, `unpkg.com`, `cdn.jsdelivr.net/npm/`, `cdn.tailwindcss.com`, and `code.jquery.com`. Google Fonts stylesheets (`fonts.googleapis.com`) and fonts (`fonts.gstatic.com`) are allowed. Images/media must use data or blob URLs; fonts can also be embedded as data URLs. Other stylesheets and relative files are blocked.

There is no `eval`, storage, network fetch, form submission, nested frame, worker, popup, or privileged message bridge. Bundle React/JSX to ordinary JavaScript and embed application data. The browser sandbox is not a virtual machine or a complete network air gap: allowed CDNs receive resource requests, self-navigation may make network requests, and heavy code can consume browser resources. Switching to **Source** stops the iframe. Downloading preserves the original HTML, which runs outside this sandbox when opened locally.
