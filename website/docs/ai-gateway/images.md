---
sidebar_position: 1
---

# Image requests

AI Gateway forwards the following POST endpoints for `openai` and `custom` providers:

```text
/api/ai/<workspaceId>/<gatewayId>/<provider>/v1/images/generations
/api/ai/<workspaceId>/<gatewayId>/<provider>/v1/images/edits
/api/ai/<workspaceId>/<gatewayId>/<provider>/v1/images/variations
```

Use `openai` for `https://api.openai.com`, or `custom` for the gateway's custom base URL. A trailing `/v1` is accepted without duplication; other path prefixes are retained. The upstream provider must support the selected endpoint and model.

Authentication follows the existing gateway rules: when a model API key is stored, send a Tianji API key belonging to a workspace member. Otherwise, the caller's bearer key is forwarded to the provider.

JSON and multipart requests retain their body, query parameters, and multipart boundaries. Multipart files and responses are streamed without saving images to disk. Upstream status codes, response headers, and response bodies pass through without retries. Image requests do not apply the gateway's custom model name override.

Image requests are direct passthrough calls. They do not create AI Gateway log entries, record payloads, calculate usage or cost, or trigger quota alerts. No database migration is required. Existing chat logging and pricing are unchanged.
