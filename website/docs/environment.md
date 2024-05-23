---
sidebar_position: 2
---

# Environment

Here is enviroment which you can config in docker

| Name | Default Value | Description |
| ---- | ---- | ----- |
| JWT_SECRET | - | A random string used to calculate the secret key |
| ALLOW_REGISTER | false | whether allow user can register account |
| ALLOW_OPENAPI | false | whether allow openapi which can fetch or post data just like you with ui |
| SANDBOX_MEMORY_LIMIT | 16 | custom script monitor sandbox memory limit, which can control which monitor script not use too many memory (unit MB, the minimum value is 8) |
| MAPBOX_TOKEN | - | MapBox token for use amap to replace default visitor map |
| AMAP_TOKEN | - | AMap token for use amap to replace default visitor map |
| CUSTOM_TRACKER_SCRIPT_NAME | - | modify default `tracker.js` script name for adblock |
| DISABLE_ANONYMOUS_TELEMETRY | false | Disabled send telemetry report to tianji official, we will report usage to tianji official website with a minimum of anonymity. |
| DISABLE_AUTO_CLEAR | false | disable auto clear data. |
