---
sidebar_position: 21
---

# Prometheus API Metrics

Tianji exposes Prometheus metrics at `/_prom/metrics`. Set `OBSERVABILITY_PROMETHEUS_METRICS_PATH` to change this path.

## HTTP Requests

`http_request_duration_seconds` records each HTTP request once, with `method`, `route`, and `code` labels.

- OpenAPI requests use route templates, such as `/open/workspace/{workspaceId}/website/{websiteId}`. IDs and query values are excluded.
- Single tRPC requests use the procedure path, such as `/trpc/website.info`.
- All tRPC batch requests use `/trpc/batch`, including batches containing only one procedure. Different procedure combinations share this label.
- Unrecognized non-batch API paths use `/open` or `/trpc`.

HTTP 5xx requests per second, grouped by route:

```promql
sum by (route) (
  rate(http_request_duration_seconds_count{
    route!="/health", route!="/", route!="N/A",
    namespace=~"$namespace", instance=~"$instance", app=~"$app",
    code=~"5[0-9]{2}"
  }[$__rate_interval])
)
```

These examples use Grafana variables. Remove the `namespace`, `instance`, or `app` filters if your scrape configuration does not provide those labels, and replace `$__rate_interval` with a range such as `5m` when querying Prometheus directly.

## Individual Procedure Calls

Use `trpc_request_duration_seconds` to see each procedure separately, including calls inside a batch and calls through OpenAPI. Its labels are `route` (for example, `website.info`), `type` (`query`, `mutation`, or `subscription`), and `status` (`success` or `error`). Each procedure invocation reaching the metrics middleware is counted separately, including repeated calls to the same procedure in a batch.

Create Grafana panels with the following queries and use `{{route}}` as the legend.

Calls per second:

```promql
sum by (route) (
  rate(trpc_request_duration_seconds_count{
    namespace=~"$namespace", instance=~"$instance", app=~"$app"
  }[$__rate_interval])
)
```

Failed calls per second:

```promql
sum by (route) (
  rate(trpc_request_duration_seconds_count{
    namespace=~"$namespace", instance=~"$instance", app=~"$app",
    status="error"
  }[$__rate_interval])
)
```

95th percentile procedure duration in seconds:

```promql
histogram_quantile(0.95,
  sum by (le, route) (
    rate(trpc_request_duration_seconds_bucket{
      namespace=~"$namespace", instance=~"$instance", app=~"$app"
    }[$__rate_interval])
  )
)
```

Procedure errors include validation and authorization failures, not just server errors. These metrics have no HTTP `code` label. A mixed-result HTTP batch can return `207`, and a streaming batch can return `200` even when a procedure fails; use `status="error"` to find those failures. Requests rejected before the procedure metrics middleware runs, such as calls to unknown procedures, are only visible in HTTP metrics.

After deploying the change, new procedure failures are recorded as `status="error"`. Historical samples previously recorded as successful are not rewritten.
