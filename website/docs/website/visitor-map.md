---
sidebar_position: 2
---

# Visitor Map

The visitor map shows the geographic distribution of website visitors. You can find it in the website analytics dashboard.

## Map Provider Selection

Tianji selects the map provider from the configured environment variables:

1. Use Mapbox when `MAPBOX_TOKEN` is set.
2. Otherwise, use AMap when `AMAP_TOKEN` is set.
3. Use the default map when neither variable is set.

When both variables are set, Mapbox takes priority.

## Configure Mapbox

Set a browser-compatible Mapbox public access token:

```bash
MAPBOX_TOKEN=your-mapbox-public-access-token
```

## Configure AMap

Set an AMap key that can be used by its browser map SDK:

```bash
AMAP_TOKEN=your-amap-key
```

Restart Tianji after changing either environment variable. For other deployment settings, see [Environment Variables](../install/environment).

## Token Safety

Map tokens are sent to the browser to load the map. Do not use a server-side secret token. Restrict the token to your Tianji domain in the provider console when that option is available.

## Troubleshooting

- If the map is blank, check the browser network panel for `401` or `403` responses, token restrictions, and provider quota limits.
- If Tianji still uses the default map, confirm that the environment variable is available to the Tianji process and restart the service.
- If the map has no visitor points, confirm that the selected date range contains visits with geographic data.
